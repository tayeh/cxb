<script lang="ts">
    import {Button, Fileupload, Input, Label, Modal, Select, Textarea} from "flowbite-svelte";
    import {ContentType, Dmart, QueryType, RequestType, ResourceAttachmentType, ResourceType} from "@edraj/tsdmart";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import HtmlEditor from "@/components/management/editors/HtmlEditor.svelte";
    import MarkdownEditor from "@/components/management/editors/MarkdownEditor.svelte";
    import {Level, showToast} from "@/utils/toast";
    import {jsonToFile} from "@/utils/jsonToFile";
    import {currentEntry} from "@/stores/global";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";

    let {
        meta = $bindable({}),
        payload = $bindable({}),
        isOpen = $bindable(false),
        isUpdateMode = $bindable(false),
        selectedAttachment = $bindable(null),
        space_name = $bindable(""),
        parentResourceType,
        subpath = $bindable(""),
        parent_shortname = $bindable(""),
    } = $props();

    let shortname = $state("");
    let displayname = $state({ en: "", ar: "", ku: "" });
    let description = $state({ en: "", ar: "", ku: "" });
    let resourceType = $state(ResourceAttachmentType.media);
    let contentType = $state(ContentType.image);
    let payloadFiles = $state<FileList | null>(null);
    let payloadData = $state("");
    let payloadContent: any = $state();
    let selectedSchema = $state("");
    let isModalInUpdateMode = $state(false);
    let trueResourceType = $state(null);
    let trueContentType = $state(null);
    let isLoading = $state(false);

    $effect(() => {
        isModalInUpdateMode = isUpdateMode;
    });

    $effect(() => {
        if (isOpen && selectedAttachment && isUpdateMode) {
            initializeFormWithAttachment(selectedAttachment);
        } else if (!isOpen) {
            resetModal();
        }
    });

    function initializeFormWithAttachment(attachment) {
        if (!attachment) return;

        const _attachment = structuredClone($state.snapshot(attachment));
        shortname = _attachment.shortname;

        if (_attachment.attributes?.displayname) {
            displayname = _attachment.attributes.displayname;
        }

        if (_attachment.attributes?.description) {
            description = _attachment.attributes.description;
        }

        // Only update payload for json, text, comment, markdown, html types
        // For all other types, only update metadata
        if (_attachment.resource_type === ResourceType.json || 
            (_attachment.resource_type === ResourceType.media && 
             [ContentType.text, ContentType.json, ContentType.markdown, ContentType.html].includes(_attachment?.attributes?.payload?.content_type)) ||
            _attachment.resource_type === ResourceType.comment) {
            // Full edit mode - update both metadata and payload
            resourceType = ResourceAttachmentType[_attachment.resource_type];
            contentType = _attachment?.attributes?.payload?.content_type;

            if (_attachment.resource_type === ResourceType.json) {
                payloadContent = { json: _attachment.attributes.payload.body };
            } else if (_attachment.resource_type === ResourceType.comment) {
                payloadData = _attachment.attributes.body;
            } else {
                payloadData = _attachment.attributes.payload.body;
            }
        } else {
            // Metadata-only edit mode
            trueResourceType = ResourceAttachmentType[_attachment.resource_type];
            trueContentType = ContentType[_attachment?.attributes?.payload?.content_type];
            resourceType = ResourceAttachmentType.json;

            const metaAttachment = structuredClone(_attachment);
            if (metaAttachment?.attributes?.payload?.body) {
                delete metaAttachment.attributes.payload.body;
            }
            payloadContent = { json: metaAttachment, text: undefined };
        }
    }

    function toggleModal() {
        isOpen = !isOpen;
    }

    function resetModal() {
        shortname = "";
        displayname = { en: "", ar: "", ku: "" };
        description = { en: "", ar: "", ku: "" };
        resourceType = ResourceAttachmentType.media;
        contentType = ContentType.image;
        payloadFiles = null;
        payloadData = "";
        payloadContent = {};
        selectedSchema = "";
    }

    async function upload(event) {
        event.preventDefault();
        isLoading = true;

        try {
            if (isUpdateMode && resourceType === ResourceAttachmentType.json && trueResourceType !== null) {
                await updateMeta();
                return;
            }

            let response;
            if (resourceType == ResourceAttachmentType.comment) {
                response = await Dmart.request({
                    space_name,
                    request_type: isModalInUpdateMode
                        ? RequestType.update
                        : RequestType.create,
                    records: [
                        {
                            resource_type: ResourceType.comment,
                            shortname: shortname,
                            subpath: parentResourceType === ResourceType.folder ? subpath : `${subpath}/${parent_shortname}`.replaceAll("//", "/"),
                            attributes: {
                                displayname: displayname,
                                description: description,
                                is_active: true,
                                state: "commented",
                                body: payloadData,
                            },
                        },
                    ],
                });
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
                    parentResourceType === ResourceType.folder ? subpath : subpath + "/" + parent_shortname,
                    shortname,
                    ResourceType[resourceType],
                    ResourceType[resourceType] === ResourceType.json
                        ? jsonToFile(payloadContent)
                        : payloadFiles[0],
                    ContentType[resourceType],
                    selectedSchema
                );
            } else if (
                [
                    ContentType.image,
                    ContentType.pdf,
                    ContentType.audio,
                    ContentType.video,
                ].includes(contentType)
            ) {
                console.log({parentResourceType})
                response = await Dmart.upload_with_payload(
                    space_name,
                    parentResourceType === ResourceType.folder ? subpath : subpath + "/" + parent_shortname,
                    shortname,
                    ResourceType[resourceType],
                    ResourceType[resourceType] === ResourceType.json
                        ? jsonToFile(payloadContent)
                        : payloadFiles[0],
                    contentType,
                    null
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
                response = await Dmart.request({
                    space_name,
                    request_type: isModalInUpdateMode
                        ? RequestType.update
                        : RequestType.create,
                    records: [
                        {
                            resource_type: ResourceType[resourceType],
                            shortname: shortname,
                            subpath: parentResourceType === ResourceType.folder ? subpath : `${subpath}/${parent_shortname}`,
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
                                            ? jsonEditorContentParser(payloadContent)
                                            : payloadData,
                                },
                            },
                        },
                    ],
                });
            }

            if (response.status === "success") {
                showToast(Level.info);
                isOpen = false;
                resetModal();
                $currentEntry.refreshEntry();
            } else {
                showToast(Level.warn);
            }
        } catch (e) {
            showToast(Level.warn, e.response.data)
        } finally {
            isLoading = false;
        }
    }

    function handleRenderMenu(menuItems) {
        return menuItems;
    }

    function setSchemaItems(schemas) {
        return schemas?.records?.map(e => e.shortname) || [];
    }

    async function updateMeta() {
        if (isUpdateMode) {
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

        try {
            const response = await Dmart.request(request_dict);
            if (response.status === "success") {
                showToast(Level.info);
                isOpen = false;
                resetModal();
                $currentEntry.refreshEntry();
            } else {
                showToast(Level.warn);
            }
        } catch (e) {
            showToast(Level.warn, e.response?.data || "Error updating metadata");
        } finally {
            isLoading = false;
        }
    }
</script>

<Modal
    bind:open={isOpen}
    size="xl"
>
    <form onsubmit={upload}>
        <div class="flex justify-between items-center px-4 pt-4 border-b rounded-t">
            <h3 class="text-xl font-semibold text-gray-900">
                {#if isUpdateMode}
                    {#if resourceType === ResourceAttachmentType.json && trueResourceType !== null}
                        Edit Attachment Metadata
                    {:else}
                        Edit Attachment Content
                    {/if}
                {:else}
                    Add Attachment
                {/if}
            </h3>
        </div>

        <div class="p-4 max-h-[75vh] overflow-y-auto">
            <div class="flex flex-col space-y-4">
                <div>
                    <Label for="shortname">Attachment shortname</Label>
                    <Input
                            id="shortname"
                            bind:value={shortname}
                            disabled={isUpdateMode}
                            required
                    />
                </div>

                <div class="space-y-2">
                    <Label>Displayname</Label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Input
                                    type="text"
                                    bind:value={displayname.en}
                                    placeholder="English..."
                            />
                        </div>
                        <div>
                            <Input
                                    type="text"
                                    bind:value={displayname.ar}
                                    placeholder="Arabic..."
                            />
                        </div>
                        <div>
                            <Input
                                    type="text"
                                    bind:value={displayname.ku}
                                    placeholder="Kurdish..."
                            />
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <Label>Description</Label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Input
                                    type="text"
                                    bind:value={description.en}
                                    placeholder="English..."
                            />
                        </div>
                        <div>
                            <Input
                                    type="text"
                                    bind:value={description.ar}
                                    placeholder="Arabic..."
                            />
                        </div>
                        <div>
                            <Input
                                    type="text"
                                    bind:value={description.ku}
                                    placeholder="Kurdish..."
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <Label for="resourceType">Attachment Type</Label>
                    <Select
                            id="resourceType"
                            bind:value={resourceType}
                            disabled={isUpdateMode}
                    >
                        {#each Object.values(ResourceAttachmentType).filter(type => type !== ResourceAttachmentType.alteration) as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </Select>
                </div>

                {#if resourceType === ResourceAttachmentType.media}
                    <div>
                        <Label for="contentType">Content Type</Label>
                        <Select
                                id="contentType"
                                bind:value={contentType}
                                disabled={isUpdateMode}
                        >
                            {#each Object.values(ContentType) as type}
                                <option value={type}>{type}</option>
                            {/each}
                        </Select>
                    </div>

                    <hr class="my-4" />

                    {#if contentType === ContentType.image}
                        <div>
                            <Label for="imageFile">Image File</Label>
                            <Fileupload
                                    id="imageFile"
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    clearable
                                    bind:files={payloadFiles}
                            />
                        </div>
                    {:else if contentType === ContentType.pdf}
                        <div>
                            <Label for="pdfFile">PDF File</Label>
                            <Fileupload
                                    id="pdfFile"
                                    type="file"
                                    accept="application/pdf"
                                    clearable
                                    bind:files={payloadFiles}
                            />
                        </div>
                    {:else if contentType === ContentType.audio}
                        <div>
                            <Label for="audioFile">Audio File</Label>
                            <Fileupload
                                    id="audioFile"
                                    type="file"
                                    accept="audio/*"
                                    clearable
                                    bind:files={payloadFiles}
                            />
                        </div>
                    {:else if contentType === ContentType.python}
                        <div>
                            <Label for="pythonFile">Python File</Label>
                            <Fileupload
                                    id="pythonFile"
                                    type="file"
                                    accept=".py"
                                    clearable
                                    bind:files={payloadFiles}
                            />
                        </div>
                    {:else if contentType === ContentType.markdown}
                        <div>
                            <MarkdownEditor bind:content={payloadData} />
                        </div>
                    {:else if contentType === ContentType.html}
                        <div>
                            <HtmlEditor bind:content={payloadData} />
                        </div>
                    {:else}
                        <div>
                            <Textarea bind:value={payloadData} />
                        </div>
                    {/if}
                {:else if resourceType === ResourceAttachmentType.json}
                    <div>
                        <JSONEditor
                                onRenderMenu={handleRenderMenu}
                                mode={Mode.text}
                                bind:content={payloadContent}
                        />
                    </div>
                {:else if resourceType === ResourceAttachmentType.comment}
                    <div>
                        <Textarea bind:value={payloadData} />
                    </div>
                {:else if resourceType === ResourceAttachmentType.csv}
                    <div>
                        <Label for="csvFile">CSV File</Label>
                        <Fileupload
                                id="csvFile"
                                type="file"
                                accept=".csv"
                                clearable
                                bind:files={payloadFiles}
                        />

                        <div class="mt-3">
                            <Label for="csvSchema">Schema</Label>
                            <Select
                                    id="csvSchema"
                                    bind:value={selectedSchema}
                                    disabled={isUpdateMode}
                            >
                                <option value="">None</option>
                                {#await Dmart.query({ space_name, type: QueryType.search, subpath: "/schema", search: "", retrieve_json_payload: true, limit: 99 }) then schemas}
                                    {#each schemas.records.map(e => e.shortname) as schema}
                                        <option value={schema}>{schema}</option>
                                    {/each}
                                {/await}
                            </Select>
                        </div>
                    </div>
                {:else if resourceType === ResourceAttachmentType.jsonl}
                    <div>
                        <Label for="jsonlFile">JSONL File</Label>
                        <Fileupload
                                id="jsonlFile"
                                type="file"
                                accept=".jsonl"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if resourceType === ResourceAttachmentType.sqlite}
                    <div>
                        <Label for="sqliteFile">SQLite File</Label>
                        <Fileupload
                                id="sqliteFile"
                                type="file"
                                accept=".sqlite,.sqlite3,.db,.db3,.s3db,.sl3"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if resourceType === ResourceAttachmentType.parquet}
                    <div>
                        <Label for="parquetFile">Parquet File</Label>
                        <Fileupload
                                id="parquetFile"
                                type="file"
                                accept=".parquet"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex justify-end space-x-2 p-4 border-t">
            <Button color="alternative" onclick={()=>{isOpen=false}} disabled={isLoading}>
                Cancel
            </Button>
            <Button color="blue" type="submit" class={isLoading ? "cursor-not-allowed" : "cursor-pointer"} disabled={isLoading}>
                {#if isLoading}
                    {isUpdateMode ? "Updating..." : "Uploading..."}
                {:else}
                    {#if isUpdateMode}
                        {#if resourceType === ResourceAttachmentType.json && trueResourceType !== null}
                            Update Metadata
                        {:else}
                            Update Content
                        {/if}
                    {:else}
                        Upload
                    {/if}
                {/if}
            </Button>
        </div>
    </form>
</Modal>
