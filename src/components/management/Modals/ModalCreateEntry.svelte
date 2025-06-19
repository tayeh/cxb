<script lang="ts">
    import {Button, Label, Modal, Select, Spinner} from "flowbite-svelte";
    import {CodeOutline, FileCodeOutline} from "flowbite-svelte-icons";
    import {Dmart, QueryType, RequestType, ResourceType} from "@edraj/tsdmart";
    import FolderForm from "@/components/management/forms/FolderForm.svelte";
    import {onMount, untrack} from "svelte";
    import {generateObjectFromSchema, scrollToElById} from "@/utils/renderer/rendererUtils";
    import Prism from "@/components/Prism.svelte";
    import MetaForm from "@/components/management/forms/MetaForm.svelte";
    import MetaUserForm from "@/components/management/forms/MetaUserForm.svelte";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import {currentEntry, currentListView, resourceTypeWithNoPayload} from "@/stores/global";
    import MetaRoleForm from "@/components/management/forms/MetaRoleForm.svelte";
    import MetaPermissionForm from "@/components/management/forms/MetaPermissionForm.svelte";
    import {Level, showToast} from "@/utils/toast";
    import SchemaForm from "@/components/management/forms/SchemaForm.svelte";
    import {removeEmpty} from "@/utils/renderer/schemaEntryRenderer";
    import WorkflowForm from "@/components/management/forms/WorkflowForm.svelte";
    import {checkAccess} from "@/utils/checkAccess";

    let {
        space_name,
        subpath,
        isOpen=$bindable(false),
    }:{
        space_name:string,
        subpath:string
        isOpen:boolean,
    } = $props();

    const folderPreference = $currentEntry?.entry?.payload?.body;

    let selectedResourceType = $state(ResourceType.content);
    let allowedResourceTypes = $state([]);

    let resourcesWithFormAndJson = [
        ResourceType.folder,
        ResourceType.schema,
    ];

    enum InputModa {
        form = "form",
        json = "json"
    }
    let selectedInputMode = $state(InputModa.form);

    function prepareResourceTypes() {
        if (space_name === "management" ){
            if (subpath === "users") {
                if(checkAccess('create', "management", "users", ResourceType.user)) {
                    allowedResourceTypes = [
                        {
                            name: ResourceType.user.toString(),
                            value: ResourceType.user,
                        }
                    ];
                } else {
                    allowedResourceTypes = [];
                }
            }
            else if (subpath === "roles") {
                if(checkAccess('create', "management", "roles", ResourceType.role)) {
                    allowedResourceTypes = [
                        {
                            name: ResourceType.role.toString(),
                            value: ResourceType.role,
                        }
                    ];
                } else {
                    allowedResourceTypes = [];
                }
            }
            else if (subpath === "permissions") {
                if(checkAccess('create', "management", "permissions", ResourceType.permission)) {
                    allowedResourceTypes = [
                        {
                            name: ResourceType.permission.toString(),
                            value: ResourceType.permission,
                        }
                    ];
                } else {
                    allowedResourceTypes = [];
                }
            }
        }
        else if (subpath === "schema") {
            if(checkAccess('create', space_name, "schema", ResourceType.schema)) {
                allowedResourceTypes = [
                    {
                        name: ResourceType.schema.toString(),
                        value: ResourceType.schema,
                    }
                ];
            } else {
                allowedResourceTypes = [];
            }
        }
        else if (subpath === "workflows") {
            if(checkAccess('create', space_name, "workflows", ResourceType.content)) {
                allowedResourceTypes = [
                    {
                        name: ResourceType.content.toString(),
                        value: ResourceType.content,
                    }
                ];
            } else {
                allowedResourceTypes = [];
            }
        }
        else {
            if(checkAccess('create', space_name, subpath, ResourceType.content)) {
                allowedResourceTypes = [
                    ...allowedResourceTypes,
                    {
                        name: ResourceType.content.toString(),
                        value: ResourceType.content,
                    }
                ];
            }
            if(checkAccess('create', space_name, subpath, ResourceType.ticket)) {
                allowedResourceTypes = [
                    ...allowedResourceTypes,
                    {
                        name: ResourceType.ticket.toString(),
                        value: ResourceType.ticket,
                    }
                ];
            }
            if(checkAccess('create', space_name, subpath, ResourceType.folder)) {
                allowedResourceTypes = [
                    ...allowedResourceTypes,
                    {
                        name: ResourceType.folder.toString(),
                        value: ResourceType.folder,
                    }
                ];
            }
        }
        if(folderPreference && folderPreference.content_resource_types.length) {
            allowedResourceTypes = allowedResourceTypes.filter(rt => folderPreference.content_resource_types.includes(rt.value));
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
        let r = result.map((e: any) => ({
            name: e,
            value: e
        }));

        if(folderPreference && folderPreference.content_schema_shortnames.length) {
            r.filter(s => folderPreference.content_schema_shortnames.includes(s.value));
        }

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

            const requestCreate: any = {
                "resource_type": selectedResourceType,
                "shortname": shortname,
                "subpath": subpath,
                "attributes": {
                    ..._metaContent
                },
            }
            if(selectedResourceType === ResourceType.ticket) {
                requestCreate.attributes.workflow_shortname = selectedWorkflow;
            }
            if(selectedResourceType === ResourceType.schema) {
                requestCreate.attributes = {
                    ...requestCreate.attributes,
                    payload: {
                        body: removeEmpty(jsonEditorContentParser($state.snapshot(content))),
                        schema: 'meta_schema',
                        content_type: "json"
                    }
                };
            } if(selectedResourceType === ResourceType.content && subpath === "workflows") {
                requestCreate.attributes = {
                    ...requestCreate.attributes,
                    payload: {
                        body: removeEmpty(jsonEditorContentParser($state.snapshot(content))),
                        schema: 'workflow',
                        content_type: "json"
                    }
                };
            }
            else if(selectedSchema) {
                requestCreate.attributes = {
                    ...requestCreate.attributes,
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
                    attributes: requestCreate.attributes
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
        } catch (e) {
            errorContent = e.response.data;
            isFolderFormReady = false;
        } finally {
            isFolderFormReady = true;
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

    let selectedWorkflow = $state(null);
    async function fetchWorkflows(){
        try {
            const result = await Dmart.query({
                search: '',
                type: QueryType.search,
                space_name,
                subpath: '/workflows'
            });
            return result.records || [];
        } catch (e) {
            showToast(Level.warn, "Failed to fetch workflows");
        }
    }

    $effect(()=>{
        if(selectedResourceType) {
            isFolderFormReady = false;
            if(selectedResourceType === ResourceType.folder) {
                untrack(() => {
                    setFolderSchemaContent();
                });
            } else {
                untrack(()=>{
                    selectedSchema = null;
                    content = {json: {}}
                })
            }
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

        <MetaForm bind:formData={metaContent} bind:validateFn={validateMetaForm} />

        {#if selectedResourceType === ResourceType.user}
            <MetaUserForm bind:formData={metaContent} bind:validateFn={validateRTForm}/>
        {:else if selectedResourceType === ResourceType.role}
            <MetaRoleForm bind:formData={metaContent} bind:validateFn={validateRTForm} />
        {:else if selectedResourceType === ResourceType.permission}
            <MetaPermissionForm bind:formData={metaContent} bind:validateFn={validateRTForm} />
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
                {#if selectedInputMode === InputModa.form}
                    <FolderForm bind:content={content.json} />
                {:else if selectedInputMode === InputModa.json}
                    <JSONEditor
                        onRenderMenu={handleRenderMenu}
                        mode={Mode.text}
                        bind:content={content}
                    />
                {/if}
            {/if}

            {#if selectedResourceType === ResourceType.ticket}
                <Label class="mt-3">
                    Workflow shortname
                    {#await fetchWorkflows()}
                        <div role="status" class="max-w-sm animate-pulse">
                            <div class="h-3 bg-gray-200 rounded-full dark:bg-gray-700 mx-2 my-2.5"></div>
                        </div>
                    {:then workflows}
                        <Select class="mt-2" items={workflows.map(w => ({name: w.shortname, value: w.shortname}))}
                                bind:value={selectedWorkflow}
                                placeholder="Select Workflow" />
                    {/await}
                </Label>

            {/if}

            {#if selectedResourceType === ResourceType.schema}
                {#if selectedInputMode === InputModa.form}
                    <SchemaForm bind:content={content.json}/>
                {:else if selectedInputMode === InputModa.json}
                    <JSONEditor
                        onRenderMenu={handleRenderMenu}
                        mode={Mode.text}
                        bind:content={content}
                    />
                {/if}
            {/if}

            {#if subpath === "workflows"}
                {#if selectedInputMode === InputModa.form}
                    <WorkflowForm bind:content={content.json}/>
                {:else if selectedInputMode === InputModa.json}
                    <JSONEditor
                            onRenderMenu={handleRenderMenu}
                            mode={Mode.text}
                            bind:content={content}
                    />
                {/if}
            {/if}

            <div class="my-2">
                {#if !resourcesWithFormAndJson.includes(selectedResourceType) && subpath !== "workflows"}
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
            {#if resourcesWithFormAndJson.includes(selectedResourceType) || subpath === "workflows"}
                <Button class="cursor-pointer text-green-700 hover:text-green-500 mx-1" outline
                        onclick={() => selectedInputMode = selectedInputMode === InputModa.form ? InputModa.json : InputModa.form}>
                    {#if selectedInputMode === InputModa.form}
                        <CodeOutline />
                    {:else }
                        <FileCodeOutline />
                    {/if}
                    {selectedInputMode === InputModa.form ? 'Json' : 'Form'} Mode
                </Button>
            {:else}
                <div></div>
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
