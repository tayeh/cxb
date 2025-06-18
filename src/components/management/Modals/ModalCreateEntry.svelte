<script lang="ts">
    import {Button, Label, Modal, Select, Spinner} from "flowbite-svelte";
    import {CodeOutline, FileCodeOutline} from "flowbite-svelte-icons";
    import {Dmart, QueryType, RequestType, ResourceType} from "@edraj/tsdmart";
    import FolderSchemaEditor from "@/components/management/editors/FolderSchemaEditor.svelte";
    import {onMount, untrack} from "svelte";
    import {generateObjectFromSchema, scrollToElById} from "@/utils/renderer/rendererUtils";
    import Prism from "@/components/Prism.svelte";
    import ModalMetaForm from "@/components/management/Modals/ModalMetaForm.svelte";
    import ModalMetaUserForm from "@/components/management/Modals/ModalMetaUserForm.svelte";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import {currentListView, resourceTypeWithNoPayload} from "@/stores/global";
    import ModalMetaRoleForm from "@/components/management/Modals/ModalMetaRoleForm.svelte";
    import ModalMetaPermissionForm from "@/components/management/Modals/ModalMetaPermissionForm.svelte";
    import {Level, showToast} from "@/utils/toast";
    import SchemaSchemaEditor from "@/components/management/editors/SchemaSchemaEditor.svelte";
    import {removeEmpty} from "@/utils/renderer/schemaEntryRenderer";

    let {
        space_name,
        subpath,
        isOpen=$bindable(false),
    }:{
        space_name:string,
        subpath:string
        isOpen:boolean,
    } = $props();

    let selectedResourceType = $state(ResourceType.content);
    let allowedResourceTypes = $state();
    let resourcesWithFormAndJson = [
        ResourceType.folder,
        ResourceType.schema,
    ];

    enum inputMode {
        form = "form",
        json = "json"
    }
    let selectedInputMode = $state(inputMode.form);

    function prepareResourceTypes() {
        if (space_name === "management" ){
            if (subpath === "users") {
                allowedResourceTypes = [
                    {
                        name: ResourceType.user.toString(),
                        value: ResourceType.user,
                    }
                ]
            } else if (subpath === "roles") {
                allowedResourceTypes = [
                    {
                        name: ResourceType.role.toString(),
                        value: ResourceType.role,
                    }
                ]
            } else if (subpath === "permissions") {
                allowedResourceTypes = [
                    {
                        name: ResourceType.permission.toString(),
                        value: ResourceType.permission,
                    }
                ]
            }
        }
        else if (subpath === "schema") {
            allowedResourceTypes = [
                {
                    name: ResourceType.schema.toString(),
                    value: ResourceType.schema,
                }
            ];
        }
        else {
            allowedResourceTypes = [
                {
                    name: ResourceType.folder.toString(),
                    value: ResourceType.folder,
                },
                {
                    name: ResourceType.content.toString(),
                    value: ResourceType.content,
                }
            ];
        }
        selectedResourceType = allowedResourceTypes[0].value;
    }

    onMount(()=>{
        prepareResourceTypes();
    });


    let selectedSchema = $state(null);
    let tmpSchemas = [];
    function parseQuerySchemaResponse(schemas){
        tmpSchemas = schemas.records;
        if (schemas === null) {
            return [{
                name: "None",
                value: null
            }];
        }
        let result = [];
        const _schemas = schemas.records.map((e) => e.shortname);
        if (selectedResourceType === ResourceType.folder) {
            result = ["folder_rendering", ..._schemas];
        } else {
            result = _schemas.filter(
                (e: any) => !["meta_schema", "folder_rendering"].includes(e)
            );
        }
        const r = result.map((e: any) => ({
            name: e,
            value: e
        }));
        r.unshift({
            name: "None",
            value: null
        });
        return r;
    }

    let content: any = $state({
        json: {}
    });
    let metaContent: any = $state({});
    let errorContent: any = $state(null);
    let validateMetaForm;
    let validateRTForm;

    let isHandleCreateEntryLoading = $state(false);
    async function handleCreateEntry() {
        if (!validateMetaForm()) {
            showToast(Level.warn, "Please fill all required fields in the meta form.");
            return;
        }
        if([ResourceType.user, ResourceType.role, ResourceType.permission].includes(selectedResourceType)){
            if (!validateRTForm()) {
                showToast(Level.warn, "Please fill all required fields in the respective resource type form.");
                return;
            }
        }

        try {
            isHandleCreateEntryLoading = true;
            let response = null;
            const _metaContent = $state.snapshot(metaContent);
            const shortname = _metaContent.shortname;
            delete _metaContent.shortname;

            const requestCreateUser = {
                "resource_type": selectedResourceType,
                "shortname": shortname,
                "subpath": subpath,
                "attributes": {
                    ..._metaContent
                },
            }
            if(selectedResourceType === ResourceType.schema) {
                requestCreateUser.attributes = {
                    ...requestCreateUser.attributes,
                    payload: {
                        body: removeEmpty(jsonEditorContentParser($state.snapshot(content))),
                        schema: 'meta_schema',
                        content_type: "json"
                    }
                };
            } else if(selectedSchema) {
                requestCreateUser.attributes = {
                    ...requestCreateUser.attributes,
                    payload: {
                        body: jsonEditorContentParser($state.snapshot(content)),
                        schema: selectedSchema,
                        content_type: "json"
                    }
                };
            }


            response = await Dmart.request({
                space_name,
                request_type: RequestType.create,
                records: [{
                    resource_type: selectedResourceType,
                    subpath: subpath,
                    shortname: metaContent.shortname,
                    attributes: requestCreateUser.attributes
                }]
            });

            if (response.attributes && response.attributes.error) {
                isHandleCreateEntryLoading = false;
                errorContent = response.attributes.error;
                return;
            }
            await $currentListView.fetchPageRecords();
            isOpen = false;
        } catch (e) {
            console.log(e)
            scrollToElById("#error-content");
            errorContent = e.response.data;
        }

        isHandleCreateEntryLoading = false;
    }

    let isFolderFormReady = $state(false);
    async function setFolderSchemaContent(){
        try {
            isFolderFormReady = false;
            const _schemaContent = await Dmart.retrieve_entry(
                ResourceType.schema,
                "management",
                "schema",
                "folder_rendering",
                true
            );
            content = {
                json: _schemaContent && generateObjectFromSchema(_schemaContent.payload.body)
            }
            isFolderFormReady = true;
        } catch (e) {
            errorContent = e.response.data;
            isFolderFormReady = false;
        }
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

    $effect(()=>{
        if(selectedResourceType) {
            if(selectedResourceType === ResourceType.folder)
            untrack(()=>{
                setFolderSchemaContent();
            });
            untrack(()=>{
                selectedSchema = null;
                content = {json: {}}
            })
        }
    });
    $effect(()=>{
        if(selectedSchema){
            untrack(()=>{
                const _schemaContent = tmpSchemas.find(t => t.shortname === selectedSchema);
                content = {
                    json: _schemaContent && generateObjectFromSchema(_schemaContent.attributes.payload.body)
                }
            });
        }
    });
</script>

<Modal
    bodyClass="h-s75vh justify-center"
    bind:open={isOpen}
    size="lg"
>
    {#snippet header()}
        <h3>Create New Entry</h3>
    {/snippet}
    <div>
        <Label>
            Resource Type
            <Select class="my-2" items={allowedResourceTypes} bind:value={selectedResourceType} />
        </Label>

        <ModalMetaForm bind:formData={metaContent} bind:validateFn={validateMetaForm} />

        {#if selectedResourceType === ResourceType.user}
            <ModalMetaUserForm bind:formData={metaContent} bind:validateFn={validateRTForm}/>
        {:else if selectedResourceType === ResourceType.role}
            <ModalMetaRoleForm bind:formData={metaContent} bind:validateFn={validateRTForm} />
        {:else if selectedResourceType === ResourceType.permission}
            <ModalMetaPermissionForm bind:formData={metaContent} bind:validateFn={validateRTForm} />
        {/if}

        {#if !resourceTypeWithNoPayload.includes(selectedResourceType)}
            {#if !["workflows", "schema"].includes(subpath) && ![ResourceType.folder, ResourceType.role, ResourceType.permission].includes(selectedResourceType)}
                <Label class="mt-3">
                    Schema
                    {#await Dmart.query({
                        space_name,
                        type: QueryType.search,
                        subpath: "/schema",
                        search: "",
                        retrieve_json_payload: true,
                        limit: 100
                    })}
                        <div role="status" class="max-w-sm animate-pulse">
                            <div class="h-3 bg-gray-200 rounded-full dark:bg-gray-700 mx-2 my-2.5"></div>
                        </div>
                    {:then schemas}
                        <Select class="mt-2" items={parseQuerySchemaResponse(schemas)} bind:value={selectedSchema} />
                    {/await}
                </Label>
            {/if}
            {#if selectedResourceType === ResourceType.folder && isFolderFormReady}
                {#if selectedInputMode === inputMode.form}
                    <FolderSchemaEditor bind:content={content.json} />
                {:else if selectedInputMode === inputMode.json}
                    <JSONEditor
                        onRenderMenu={handleRenderMenu}
                        mode={Mode.text}
                        bind:content={content}
                    />
                {/if}
            {/if}
            {#if selectedResourceType === ResourceType.schema}
                {#if selectedInputMode === inputMode.form}
                    <SchemaSchemaEditor bind:content={content.json}/>
                {:else if selectedInputMode === inputMode.json}
                    <JSONEditor
                        onRenderMenu={handleRenderMenu}
                        mode={Mode.text}
                        bind:content={content}
                    />
                {/if}
            {/if}

            <div class="my-2">
                {#if !resourcesWithFormAndJson.includes(selectedResourceType)}
                    <JSONEditor
                        onRenderMenu={handleRenderMenu}
                        mode={Mode.text}
                        bind:content={content}
                    />
                {/if}
            </div>
        {/if}


        {#if errorContent}
            <div id="error-content" class="mt-3">
                <Prism code={errorContent} language={"json"} />
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <div class="w-full flex flex-row justify-between">
            {#if resourcesWithFormAndJson.includes(selectedResourceType)}
                <Button class="cursor-pointer text-green-700 hover:text-green-500 mx-1" outline
                        onclick={() => selectedInputMode = selectedInputMode === inputMode.form ? inputMode.json : inputMode.form}>
                    {#if selectedInputMode === inputMode.form}
                        <CodeOutline />
                    {:else }
                        <FileCodeOutline />
                    {/if}
                    {selectedInputMode === inputMode.form ? 'Json' : 'Form'} Mode
                </Button>
            {/if}
            <div>
                {#if !isHandleCreateEntryLoading}
                    <Button class="cursor-pointer text-primary hover:text-primary mx-1" outline onclick={() => isOpen = false}>
                        Close
                    </Button>
                {/if}

                <Button class="cursor-pointer bg-primary mx-1" onclick={handleCreateEntry}>
                    {#if isHandleCreateEntryLoading}
                        <Spinner class="me-3" size="4" color="blue" />
                        Creating ...
                    {:else}
                        Create
                    {/if}
                </Button>
            </div>
        </div>
    {/snippet}
</Modal>
