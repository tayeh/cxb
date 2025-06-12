<script lang="ts">
  import {
    Dmart,
    type ApiResponse,
    ContentType,
    ContentTypeMedia,
    QueryType,
    RequestType,
    ResourceAttachmentType,
    ResourceType,
    type Translation,
  } from "@edraj/tsdmart";
  import { Level, showToast } from "@/utils/toast";
  import {
    Button, Card, Dropdown, DropdownItem,
    Input,
    Label,
    Modal,
    Badge,
    CardPlaceholder,
  } from "flowbite-svelte";
  import { JSONEditor, Mode } from "svelte-jsoneditor";
  import { jsonToFile } from "@/utils/jsonToFile";
  import Prism from "@/components/Prism.svelte";
  import { parseCSV, parseJSONL } from "@/utils/attachements";
  import { AxiosError } from "axios";
  import MarkdownEditor from "@/components/management/editors/MarkdownEditor.svelte";
  import HtmlEditor from "@/components/management/editors/HtmlEditor.svelte";
  import {untrack} from "svelte";
  import Media from "@/components/management/renderers/Media.svelte";
  import {
    DotsHorizontalOutline, EyeSolid, PenSolid, TrashBinSolid,
    FileImageOutline, FileCsvOutline,FileOutline, ListOutline, FileLinesOutline,
    UploadOutline
  } from "flowbite-svelte-icons";
  import {getSpaces} from "@/lib/dmart_services";
  import {jsonEditorContentParser} from "@/utils/jsonEditor";
  import {website} from "@/config";
  import ModalViewAttachments from "@/components/management/Modals/ModalViewAttachments.svelte";
  import {getFileExtension} from "@/utils/getFileExtension";


  let {
    attachments = [],
    resource_type,
    space_name,
    subpath,
    parent_shortname,
    refreshEntry,
  } :{
    attachments: any,
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    parent_shortname: string,
    refreshEntry: any,
  } = $props();

  let selectedFilter = $state("all");
  let filteredAttachments: any = $state(Object.values(attachments).flat(1));

  async function fetchDataAssetsForAttachments() {
    for (const attachment of filteredAttachments) {
      if (["csv", "parquet", "jsonl"].includes(attachment.resource_type)) {
        const r = await Dmart.fetchDataAsset(
          resource_type,
          attachment.resource_type,
          space_name,
          subpath,
          parent_shortname,
          `SELECT * FROM '${attachment.shortname}'`
        );
        if (!(r instanceof AxiosError)) {
          attachment.dataAsset = r;
        } else {
          attachment.dataAsset = {
            code: r.response.data?.error?.code,
            message: r.response.data?.error?.message,
          };
          if(r.response.data?.error?.info.length > 0) {
              attachment.dataAsset.details = r.response.data?.error?.info[0].msg;
          }
        }
      } else if (attachment.resource_type === "sqlite") {
        const tables = await Dmart.fetchDataAsset(
          resource_type,
          attachment.resource_type,
          space_name,
          subpath,
          parent_shortname,
          "SELECT * FROM temp.information_schema.tables",
          [attachment.shortname]
        );
        attachment.dataAsset = (
          await Promise.all(
            tables.map(async (table) => {
              const r = await Dmart.fetchDataAsset(
                resource_type,
                attachment.resource_type,
                space_name,
                subpath,
                parent_shortname,
                `SELECT * FROM '${table.table_name}' LIMIT 10`,
                [attachment.shortname]
              );
              return r instanceof AxiosError
                ? null
                : { table_name: table.table_name, rows: r };
            })
          )
        ).filter((item) => item !== null);
      }
    }
  }

  // exp rt let forceRefresh;
  let shortname = $state("auto");
  let isModalInUpdateMode = $state(false);
  let openViewAttachmentModal = $state(false);
  let openMetaEditAttachmentModal = $state(false);

  function toggleViewAttachmentModal() {
    openViewAttachmentModal = !openViewAttachmentModal;
  }

  function toggleMetaEditAttachmentModal() {
    openMetaEditAttachmentModal = !openMetaEditAttachmentModal;
  }

  let openCreateAttachemntModal = $state(false);

  function toggleCreateAttachemntModal() {
    openCreateAttachemntModal = !openCreateAttachemntModal;
  }

  let content = $state({
    json: {},
    text: undefined,
  });

  function handleView(attachment) {
    content = {
      json: attachment,
      text: undefined,
    };
    openViewAttachmentModal = true;
  }

  async function handleDelete(item: {
    shortname: string;
    subpath: string;
    resource_type: ResourceType;
  }) {
    if (
      confirm(`Are you sure want to delete ${item.shortname} attachment`) ===
      false
    ) {
      return;
    }

    const request_dict = {
      space_name,
      request_type: RequestType.delete,
      records: [
        {
          resource_type: item.resource_type,
          shortname: item.shortname,
          subpath: `${item.subpath}/${parent_shortname}`,
          attributes: {},
        },
      ],
    };
    const response = await Dmart.request(request_dict);
    if (response.status === "success") {
      showToast(Level.info);
      attachments = attachments.filter(
        (e: { shortname: string }) => e.shortname !== item.shortname
      );
      openCreateAttachemntModal = false;
      refreshEntry()
    } else {
      showToast(Level.warn);
    }
  }

  let payloadFiles: FileList = $state();
  let displayname: Translation = {
    'en': "",
    'ar': "",
    'ku': "",
  };
  let description: Translation = {
    'en': "",
    'ar': "",
    'ku': "",
  };

  let payloadContent: any = $state({ json: {}, text: undefined });
  let payloadData: string = $state();
  let selectedSchema: string = $state();
  let resourceType: ResourceAttachmentType = $state(ResourceAttachmentType.media);
  let contentType: ContentType = $state(ContentType.image);

  async function upload() {
    let response: ApiResponse;
    if (resourceType == ResourceAttachmentType.comment) {
      const request_dict = {
        space_name,
        request_type: isModalInUpdateMode
          ? RequestType.update
          : RequestType.create,
        records: [
          {
            resource_type: ResourceType.comment,
            shortname: shortname,
            subpath: `${subpath}/${parent_shortname}`.replaceAll("//", "/"),
            attributes: {
              displayname: displayname,
              description: description,
              is_active: true,
              state: "commented",
              body: payloadData,
            },
          },
        ],
      };
      response = await Dmart.request(request_dict);
    } else if (
      [
        ResourceAttachmentType.csv,
        ResourceAttachmentType.jsonl,
        ResourceAttachmentType.sqlite,
        ResourceAttachmentType.parquet,
      ].includes(resourceType)
    ) {
      response = await Dmart.upload_with_payload(
        space_name,
        subpath + "/" + parent_shortname,
        shortname,
        ResourceType[resourceType],
              ResourceType[resourceType] === ResourceType.json
                      ? jsonToFile(payloadContent)
                      : payloadFiles[0],
        ContentType[resourceType],
        resourceType === ResourceAttachmentType.csv ? selectedSchema : null,

      );
    } else if (
      [
        ContentType.image,
        ContentType.pdf,
        ContentType.audio,
        ContentType.video,
      ].includes(contentType)
    ) {
      response = await Dmart.upload_with_payload(
        space_name,
        subpath + "/" + parent_shortname,
        shortname,
        ResourceType[resourceType],
        ResourceType[resourceType] === ResourceType.json
                ? jsonToFile(payloadContent)
                : payloadFiles[0],
        ContentType[resourceType],
        null,
      );
    } else if (
      [
        ContentType.json,
        ContentType.text,
        ContentType.html,
        ContentType.markdown,
        ContentType,
      ].includes(contentType)
    ) {
      let _payloadContent = payloadContent.json
        ? structuredClone($state.snapshot(payloadContent).json)
        : JSON.parse(payloadContent.text ?? "{}");
      let request_dict = {
        space_name,
        request_type: isModalInUpdateMode
          ? RequestType.update
          : RequestType.create,
        records: [
          {
            resource_type: ResourceType[resourceType],
            shortname: shortname,
            subpath: `${subpath}/${parent_shortname}`,
            attributes: {
              displayname: displayname,
              description: description,
              is_active: true,
              payload: {
                content_type: contentType,
                schema_shortname:
                  resourceType == ResourceAttachmentType.json && selectedSchema
                    ? selectedSchema
                    : null,
                body:
                  resourceType == ResourceAttachmentType.json
                    ? _payloadContent
                    : payloadData,
              },
            },
          },
        ],
      };
      response = await Dmart.request(request_dict);
    }

    if (response.status === "success") {
      showToast(Level.info);
      openCreateAttachemntModal = false;
      refreshEntry()
    } else {
      showToast(Level.warn);
    }
  }

  let trueResourceType = null;
  let trueContentType = null;

  async function updateMeta() {
    if (isModalInUpdateMode) {
      if (trueResourceType !== null) {
        resourceType = trueResourceType;
        trueResourceType = null;
      }
      if (trueContentType !== null) {
        contentType = trueContentType;
        trueContentType = null;
      }
    }

    let _payloadContent = payloadContent.json
      ? structuredClone($state.snapshot(payloadContent).json)
      : JSON.parse($state.snapshot(payloadContent).text ?? "{}");

    _payloadContent.subpath = `${subpath}/${parent_shortname}`;
    const request_dict = {
      space_name,
      request_type: RequestType.update,
      records: [_payloadContent],
    };
    const response = await Dmart.request(request_dict);
    if (response.status === "success") {
      showToast(Level.info);
      openCreateAttachemntModal = false;
      refreshEntry()
    } else {
      showToast(Level.warn);
    }
  }

  $effect(() => {
    switch (resourceType) {
      case ResourceAttachmentType.media:
        untrack(() => {
          contentType = ContentType.image;
        });
        break;
      case ResourceAttachmentType.comment:
        untrack(() => {
          contentType = ContentType.text;
        });
        break;
      case ResourceAttachmentType.json:
        untrack(() => {
          contentType = ContentType.json;
        });
        break;
    }
  });

  function handleMetaEditModal(attachment) {
    attachment = $state.snapshot(attachment);
    const _attachment = structuredClone(attachment);
    trueResourceType = ResourceAttachmentType[_attachment.resource_type];
    trueContentType = ContentType[_attachment?.payload?.content_type];
    delete _attachment?.payload?.body;
    shortname = _attachment.shortname;
    resourceType = ResourceAttachmentType.json;
    payloadContent = { json: _attachment, text: undefined };

    openMetaEditAttachmentModal = true;
    isModalInUpdateMode = true;
  }

  function handleContentEditModal(attachment) {
    attachment = $state.snapshot(attachment);
    const _attachment = structuredClone(attachment);
    shortname = _attachment.shortname;

    resourceType = _attachment.resource_type;
    contentType = _attachment?.attributes.payload?.content_type;
    if (attachment.resource_type === ResourceAttachmentType.json) {
      payloadContent = { json: _attachment.attributes.payload.body };
    } else if (attachment.resource_type === ResourceAttachmentType.comment) {
      payloadData = _attachment.attributes.body;
    } else {
      payloadData = _attachment.attributes.payload.body;
    }

    openCreateAttachemntModal = true;
    isModalInUpdateMode = true;
  }

  function handleRenderMenu(items: any, _context: any) {
    items = items.filter(
      (item) => !["tree", "text", "table"].includes(item.text)
    );
    const separator = {
      separator: true,
    };

    const itemsWithoutSpace = items.slice(0, items.length - 2);
    return itemsWithoutSpace.concat([
      separator,
      {
        space: true,
      },
    ]);
  }

  function setSchemaItems(schemas): Array<string> {
    if (schemas === null) {
      return [];
    }
    const _schemas = schemas.records.map((e) => e.shortname);
    return _schemas.filter(
      (e) => !["meta_schema", "folder_rendering"].includes(e)
    );
  }

  function viewMeta(attachment){}
  function editAttachment(attachment){}
  function confirmDelete(attachment){}

  let openViewContentModal = $state(false);
  let selectedAttachment = $state(null);

  function handleViewContentModal(attachment) {
    selectedAttachment = attachment;
    openViewContentModal = true;
  }

  $effect(()=>{
    if(selectedFilter === "all") {
      filteredAttachments = Object.values(attachments).flat(1);
    } else {
        filteredAttachments = attachments[selectedFilter] || [];
    }
  });
</script>

<Modal
  bind:open={openMetaEditAttachmentModal}
  size={"lg"}
>
  <div>
    <JSONEditor
      onRenderMenu={handleRenderMenu}
      mode={Mode.text}
      bind:content={payloadContent}
    />
  </div>
  <div>
    <Button type="button" color="primary" onclick={updateMeta}>Update</Button>
    <Button
      type="button"
      color="secondary"
      onclick={() => (openMetaEditAttachmentModal = false)}
    >
      close
    </Button>
  </div>
</Modal>

<Modal
  bind:open={openCreateAttachemntModal}
  size={"lg"}
>
<!--  <ModalHeader toggle={toggleCreateAttachemntModal}>-->
<!--    <h3>-->
<!--      {isModalInUpdateMode ? "Update attachment" : "Add attachment"}-->
<!--    </h3>-->
<!--  </ModalHeader>-->

  <div class="modal-header">
    <h5 class="modal-title">
      {isModalInUpdateMode ? "Update attachment" : "Add attachment"}
    </h5>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <button type="button" onclick={toggleCreateAttachemntModal} class="btn-close" aria-label="Close">
    </button>
  </div>

  <div>
    <div class="d-flex flex-column">
      <Label>Attachment shortname</Label>
      <Input
        accept="image/png, image/jpeg"
        bind:value={shortname}
        disabled={isModalInUpdateMode}
      />

      <div class="flex-row my-2">
        <div class="12"><Label>Displayname</Label></div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={displayname.en}
                  placeholder={"english..."}
          />
        </div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={displayname.ar}
                  placeholder={"arabic..."}
          />
        </div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={displayname.ku}
                  placeholder={"kurdish..."}
          />
        </div>
      </div>

      <div class="flex-row my-2">
        <div class="12"><Label>Description</Label></div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={description.en}
                  placeholder={"english..."}
          />
        </div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={description.ar}
                  placeholder={"arabic..."}
          />
        </div>
        <div class="4">
          <Input
                  type="text"
                  class="form-control"
                  bind:value={description.ku}
                  placeholder={"kurdish..."}
          />
        </div>
      </div>

      <Label>Attachment Type</Label>
      <Input
        type="select"
        bind:value={resourceType}
        disabled={isModalInUpdateMode}
      >
        {#each Object.values(ResourceAttachmentType).filter((type) => type !== ResourceAttachmentType.alteration) as type}
          <option value={type}>{type}</option>
        {/each}
      </Input>
      {#key resourceType}
        {#if resourceType === ResourceAttachmentType.media}
          <Label>Content Type</Label>
          <Input
            type="select"
            bind:value={contentType}
            disabled={isModalInUpdateMode}
          >
            {#each Object.values(ContentTypeMedia) as type}
              <option value={type}>{type}</option>
            {/each}
          </Input>
        {/if}
      {/key}
      <hr />
      {#key resourceType}
        {#if resourceType === ResourceAttachmentType.media}
          {#if contentType === ContentType.image}
            <Label>Image File</Label>
            <Input
              accept="image/png, image/jpeg"
              files={payloadFiles}
              type="file"
            />
          {:else if contentType === ContentType.pdf}
            <Label>PDF File</Label>
            <Input
              accept="application/pdf"
              files={payloadFiles}
              type="file"
            />
          {:else if contentType === ContentType.audio}
            <Label>Audio File</Label>
            <Input accept="audio/*" files={payloadFiles} type="file" />
          {:else if contentType === ContentType.python}
            <Label>Python File</Label>
            <Input accept=".py" files={payloadFiles} type="file" />
          {:else if contentType === ContentType.markdown}
            <MarkdownEditor bind:content={payloadData} />
          {:else if contentType === ContentType.html}
            <HtmlEditor bind:content={payloadData} />
          {:else}
            <Input type={"textarea"} bind:value={payloadData} />
          {/if}
        {:else if resourceType === ResourceAttachmentType.json}
          <Label>Schema</Label>
          <Input
            class="mb-3"
            bind:value={selectedSchema}
            type="select"
            disabled={isModalInUpdateMode}
          >
            <option value={""}>{"None"}</option>
            {#await Dmart.query( { space_name, type: QueryType.search, subpath: "/schema", search: "", retrieve_json_payload: true, limit: 99 } ) then schemas}
              {#each schemas.records.map((e) => e.shortname) as schema}
                <option value={schema}>{schema}</option>
              {/each}
            {/await}
          </Input>
          <JSONEditor
            onRenderMenu={handleRenderMenu}
            mode={Mode.text}
            bind:content={payloadContent}
          />
        {:else if resourceType === ResourceAttachmentType.comment}
          <Input type={"textarea"} bind:value={payloadData} />
        {:else if resourceType === ResourceAttachmentType.csv}
          <Label>Schema</Label>
          <Input bind:value={selectedSchema} type="select">
            <option value={null}>{"None"}</option>
            {#await Dmart.query( { space_name, type: QueryType.search, subpath: "/schema", search: "", retrieve_json_payload: true, limit: 99 } ) then schemas}
              {#each setSchemaItems(schemas) as schema}
                <option value={schema}>{schema}</option>
              {/each}
            {/await}
          </Input>
          <Label class="mt-3">CSV File</Label>
          <Input files={payloadFiles} type="file" accept=".csv" />
        {:else if resourceType === ResourceAttachmentType.jsonl}
          <Label>JSONL File</Label>
          <Input files={payloadFiles} type="file" accept=".jsonl" />
        {:else if resourceType === ResourceAttachmentType.sqlite}
          <Label>SQLite File</Label>
          <Input
            files={payloadFiles}
            type="file"
            accept=".sqlite,.sqlite3,.db,.db3,.s3db,.sl3"
          />
        {:else if resourceType === ResourceAttachmentType.parquet}
          <Label>Parquet File</Label>
          <Input files={payloadFiles} type="file" accept=".parquet" />
          <b> TBD ... show custom fields for resource type : {resourceType} </b>
        {/if}
      {/key}
    </div>
  </div>
  <div>
    <Button
      type="button"
      color="secondary"
      onclick={() => (openCreateAttachemntModal = false)}
      >close
    </Button>
    <Button type="button" color="primary" onclick={upload}>Upload</Button>
  </div>
</Modal>

<Modal
  open={openViewAttachmentModal}
  size={"lg"}
>
  <div>
    <JSONEditor
      onRenderMenu={handleRenderMenu}
      mode={Mode.text}
      {content}
      readOnly={true}
    />
  </div>
  <div>
    <Button
      type="button"
      color="secondary"
      onclick={() => (openViewAttachmentModal = false)}
      >close
    </Button>
  </div>
</Modal>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="d-flex justify-content-between mx-2 flex-row">

</div>

{#await fetchDataAssetsForAttachments()}
  <div class="flex flex-row">
    <CardPlaceholder size="md" class="mt-8" />
    <CardPlaceholder size="md" class="mt-8" />
    <CardPlaceholder size="md" class="mt-8" />
  </div>
{:then _}
  <div class="d-flex justify-content-center flex-column px-5 mt-2">
    <div class="flex justify-between">
      <div>
        <Badge class={selectedFilter === "all" ? "m-1 bg-primary text-white" : "m-1 bg-[#F5F5FF] text-primary"} style="cursor: pointer;"
               onclick={() => {
            selectedFilter = 'all';
          }}
        >
          <ListOutline size="lg"  />
          ALL ({filteredAttachments.length})
        </Badge>
        {#each Object.keys(attachments) as key}
          <Badge class={selectedFilter === key ? "m-1 bg-primary text-white" : "m-1 bg-[#F5F5FF] text-balck"} style="cursor: pointer;"
                 onclick={() => {
            selectedFilter = key;
          }}>
        <span class="inline-flex items-center gap-2">
          {#if key === "media"}
            <FileImageOutline size="lg" />
          {:else if key === "csv"}
            <FileCsvOutline size="lg" />
          {:else if key === "comment" || key === "json"}
            <FileLinesOutline size="lg" />
          {:else}
            <FileOutline size="lg" />
          {/if}
          {key.toUpperCase()} ({attachments[key].length})
        </span>
          </Badge>
        {/each}
      </div>
      <Button class="bg-primary cursor-pointer">
        <UploadOutline size="md" class="mr-2"/>
        <strong>UPLOAD</strong>
      </Button>
    </div>

    <div class="my-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 w-full place-items-center">
      {#each filteredAttachments as attachment}
      <Card class="relative w-full">
        <div class="absolute top-2 left-2">
          <Button class="!p-1" color="light">
            <DotsHorizontalOutline />
            <Dropdown simple>
              <DropdownItem class="w-full" onclick={() => viewMeta(attachment)}>
                <div class="flex items-center gap-2">
                  <EyeSolid size="sm" /> View Meta
                </div>
              </DropdownItem>
              <DropdownItem class="w-full" onclick={() => editAttachment(attachment)}>
                <div class="flex items-center gap-2">
                  <PenSolid size="sm" /> Edit
                </div>
              </DropdownItem>
              <DropdownItem class="w-full" onclick={() => confirmDelete(attachment)}>
                <div class="flex items-center gap-2 text-red-600">
                  <TrashBinSolid size="sm" /> Delete
                </div>
              </DropdownItem>
            </Dropdown>
          </Button>
        </div>

        <div class="flex flex-col items-center text-center p-4">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span class="inline-block px-3 py-1 mb-3 border border-gray-300 rounded-md text-sm font-medium bg-primary"
            onclick={() => handleViewContentModal(attachment)}
          >
            {#if attachment.resource_type === ResourceType.media}
              <FileImageOutline size="xl" class="text-white" />
            {:else if attachment.resource_type === ResourceType.csv}
              <FileCsvOutline size="xl" class="text-white"/>
            {:else if [ResourceType.comment, ResourceType.json].includes(attachment.resource_type)}
              <FileLinesOutline size="xl" class="text-white"/>
            {:else}
              <FileOutline size="xl" class="text-white" />
            {/if}
          </span>

          {#if attachment.resource_type === ResourceType.media}
            <a class="font-semibold text-lg underline text-primary" href={Dmart.get_attachment_url(
                attachment.resource_type, space_name, subpath, parent_shortname, attachment.shortname,
                getFileExtension(attachment.attributes?.payload?.body)
            )} target="_blank">{attachment.attributes?.displayname?.en || attachment.shortname}</a>
            {:else}
            <p class="font-semibold text-lg">
              {attachment.attributes?.displayname?.en || attachment.shortname}
            </p>
          {/if}
          <p class="text-gray-600 mt-2 mb-4 line-clamp-3">
            {attachment?.description?.en || "No description available"}
          </p>

          <div class="text-xs text-gray-500 mt-auto">
            Updated: {new Date(attachment?.attributes.updated_at).toLocaleDateString()}
          </div>
        </div>
      </Card>
    {/each}
    </div>
  </div>
{/await}


<ModalViewAttachments
  bind:openViewContentModal={openViewContentModal}
  selectedAttachment={selectedAttachment}
  space_name={space_name}
  subpath={subpath}
  parent_shortname={parent_shortname}
/>