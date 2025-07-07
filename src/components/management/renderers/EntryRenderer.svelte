<script lang="ts">
    import ListView from "@/components/management/ListView.svelte";
    import {Dmart, RequestType, ResourceType, type ResponseEntry} from "@edraj/tsdmart";
    import {checkAccess} from "@/utils/checkAccess";
    import {
        ClockOutline,
        DrawSquareSolid,
        EditOutline,
        EyeSolid,
        FloppyDiskOutline,
        ListOutline,
        PaperClipOutline,
        RectangleListOutline,
        TrashBinOutline,
        RefreshOutline,
    } from "flowbite-svelte-icons";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";
    import {Level, showToast} from "@/utils/toast";
    import Prism from "@/components/Prism.svelte";
    import Table2Cols from "@/components/management/Table2Cols.svelte";
    import Attachments from "@/components/management/renderers/Attachments.svelte";
    import BreadCrumbLite from "@/components/management/BreadCrumbLite.svelte";
    import {currentEntry} from "@/stores/global";
    import MetaForm from "@/components/management/forms/MetaForm.svelte";
    import MetaUserForm from "@/components/management/forms/MetaUserForm.svelte";
    import MetaRoleForm from "@/components/management/forms/MetaRoleForm.svelte";
    import MetaPermissionForm from "@/components/management/forms/MetaPermissionForm.svelte";
    import {untrack} from "svelte";
    import {goto} from "@roxi/routify";
    $goto
    import HistoryListView from "@/components/management/HistoryListView.svelte";
    import SchemaForm from "@/components/management/forms/SchemaForm.svelte";
    import FolderForm from "@/components/management/forms/FolderForm.svelte";
    import {removeEmpty} from "@/utils/renderer/schemaEntryRenderer";
    import WorkflowForm from "@/components/management/forms/WorkflowForm.svelte";
    import MetaTicketForm from "@/components/management/forms/MetaTicketForm.svelte";
    import WorkflowDiagram from "@/components/management/diagram/WorkflowDiagram.svelte";
    import SchemaDiagram from "@/components/management/diagram/SchemaDiagram.svelte";
    import {CardPlaceholder, TextPlaceholder,Modal,Button} from "flowbite-svelte";
    import DynamicSchemaBasedForms from "@/components/management/forms/DynamicSchemaBasedForms.svelte";
    import TranslationForm from "@/components/management/forms/TranslationForm.svelte";
    import {searchListView} from "@/stores/management/triggers";
    import {isDeepEqual} from "@/utils/compare";


    enum TabMode {
        list = 0,
        entry = 1,
        form = 2,
        attachments = 3,
        history = 4,
        diagram = 5,
    }

    let {
        entry = $bindable(),
        space_name,
        subpath,
        resource_type,
    }: {
        entry: ResponseEntry,
        space_name: string,
        subpath: string,
        resource_type: ResourceType,
    } = $props();

    $searchListView = "";
    
    const schemaShortname = entry?.payload?.schema_shortname || null;
    
    currentEntry.set({
        entry,
        refreshEntry
    });

    let coinTriggerRefresh = $state(false);

    let jeContent: any = $state({ json: structuredClone(entry) });
    let originalJeContent: any = $state({});
    setTimeout(() => {
        originalJeContent = jsonEditorContentParser(
            $state.snapshot(jeContent)
        );
    }, 64);
    let isJEDirty = $state(false);

    let ticketData: any = $state({
        action: null,
        resolution: null,
        comment: null,
    });
    let errorMessage = $state(null);

    const canUpdate = checkAccess("update", space_name, subpath, resource_type);
    const canDelete = (()=>{
        if(space_name=== "management"){
            if(resource_type === ResourceType.space || resource_type === ResourceType.folder) {
                return false;
            }
        }
        return checkAccess("delete", space_name, subpath, resource_type);
    })();

    let activeTab: TabMode = $state(TabMode.list);
    let isActionLoading = $state(false);
    let validateMetaForm;
    let validateRTForm;

    async function progressTicket(e){
        e.preventDefault();
        try {
            await Dmart.progress_ticket(
                space_name,
                subpath,
                entry.shortname,
                ticketData.action,
                ticketData.resolution,
                ticketData.comment,
            );
            ticketData = {
                action: null,
                resolution: null,
                comment: null,
            }
            showToast(Level.info, `Ticket has been updated successfully!`);
            refreshEntry();
        } catch (error) {
            showToast(Level.warn, `Failed to update the ticket!`);
            isActionLoading = false;
            return;
        }
    }

    function getParentSubpath(path: string): string {
        const parts = path.replace(/^\/+|\/+$/g, "").split("/");
        return parts.length > 1 ? "/" + parts.slice(1).join("/") : "/";
    }

    async function handleSave(){
        isActionLoading = true;
        const content = jsonEditorContentParser($state.snapshot(jeContent));

        const shortname = content.shortname;
        delete content.uuid;
        delete content.shortname;

        if (resource_type === ResourceType.schema) {
            content.payload.body = removeEmpty(content.payload.body);
        }
        else if(resource_type === ResourceType.content && subpath === "workflows") {
            content.payload = {
                body: removeEmpty(jsonEditorContentParser($state.snapshot(content.payload.body))),
                schema: 'workflow',
                content_type: "json"
            };
        }

        try {
            errorMessage = null;
            await Dmart.request({
                space_name: space_name,
                request_type: RequestType.replace,
                records: [{
                    resource_type: resource_type,
                    shortname: shortname,
                    subpath: resource_type === ResourceType.folder ? getParentSubpath(subpath)  : subpath,
                    attributes: content
                }]
            })
            showToast(Level.info, `Entry has been updated successfully!`);
            await refreshEntry();
        }
        catch (error) {
            errorMessage = error.response.data;
        }
        finally {
            isActionLoading = false;
        }
    }

    let openDeleteModal = $state(false);
    function deleteCurrentEntryModal() {
        openDeleteModal = true;
    }
    async function deleteCurrentEntry() {
        isActionLoading = true;

        let targetSubpath: string;
        if (resource_type === ResourceType.folder) {
            const arr = subpath.split("/");
            arr[arr.length - 1] = "";
            targetSubpath = arr.join("/");
        } else {
            targetSubpath = subpath;
        }

        try {
            await Dmart.request({
                space_name: space_name,
                request_type: RequestType.delete,
                records: [{
                    resource_type: resource_type,
                    shortname: entry.shortname,
                    subpath: targetSubpath || '/',
                    attributes: {}
                }]
            });
            showToast(Level.info, `Entry deleted successfully`);
            if(resource_type === ResourceType.space) {
                $goto(`/management/content`);
            } else if(resource_type === ResourceType.folder) {
                const _subpath = subpath.split("/").slice(0, -1).join("-") || "";
                $goto(`/management/content/[space_name]/[subpath]`, {
                    space_name: space_name,
                    subpath: _subpath
                });
            } else {
                $goto(`/management/content/[space_name]/[subpath]`, {
                    space_name: space_name,
                    subpath: subpath
                });
            }
        } catch (error) {
            errorMessage = error.message;
            showToast(Level.warn, `Failed to delete the entry!`);
        } finally {
            isActionLoading = false;
        }
    }

    // function handleRenderMenu(
    //     items: any,
    //     context: { mode: "tree" | "text" | "table"; modal: boolean }
    // ) {
    //     return items.concat([
    //         {
    //             onClick: handleSave,
    //             icon: {
    //                 prefix: 'prefix',
    //                 iconName: 'iconName',
    //                 icon: [
    //                     448,
    //                     512,
    //                     [128190,128426,"save"],
    //                     'f0c7',
    //                     'M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z'
    //                 ]
    //             },
    //             title: "Save",
    //         }
    //     ]);
    // }

    async function refreshEntry() {
        if (resource_type === ResourceType.folder) {
            const _subpath = subpath.split("/");
            let parent_subpath: string = _subpath.slice(0, _subpath.length - 1).join("/") || "__root__";
            let _shortname: string = _subpath[_subpath.length - 1];
            entry = await Dmart.retrieve_entry(ResourceType.folder, space_name, parent_subpath, _shortname, true, true);
        } else {
            entry = await Dmart.retrieve_entry(resource_type, space_name, subpath, entry.shortname, true, true);
        }
        jeContent = { json: $state.snapshot(entry) };
        originalJeContent = jsonEditorContentParser($state.snapshot(jeContent));
        currentEntry.set({
            entry,
            refreshEntry
        });
        coinTriggerRefresh = !coinTriggerRefresh;
    }

    $effect(()=>{
        if(activeTab === TabMode.entry){
            untrack(()=>{
                const _jeContent = jsonEditorContentParser($state.snapshot(jeContent));
                jeContent = { text: JSON.stringify(_jeContent, null, 2) };
            });
        } else if(activeTab === TabMode.form){
            untrack(()=>{
                const _jeContent = jsonEditorContentParser($state.snapshot(jeContent));
                jeContent = { json: _jeContent };
            });
        }
    });

    async function getPayloadSchema() {
        if(schemaShortname === "folder_rendering"){
            return await Dmart.retrieve_entry(ResourceType.schema,"management","schema",schemaShortname,true,false)
        }
        return await Dmart.retrieve_entry(ResourceType.schema,space_name,"schema",schemaShortname,true,false)
    }

    let isRefreshLoading = $state(false);
    async function handleRefresh(e){
        if(e){
            e.preventDefault();
        }

        if(isJEDirty){
            if(!confirm("You have unsaved changes. Do you want to discard them and refresh?")) {
                return;
            }
        }

        await refreshEntry();
    }

    $effect(() => {
        if (jeContent) {
            isJEDirty = !isDeepEqual(
                jsonEditorContentParser($state.snapshot(jeContent)),
                originalJeContent
            );
        }
    });
</script>



<div class="flex flex-col w-full">
    <BreadCrumbLite
        {space_name}
        {subpath}
        {resource_type}
        schema_name={schemaShortname}
        shortname={entry.shortname}
    />

    <div class="border-b border-gray-200">
        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
            <li class="mr-2" role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.list ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.list}
                        onclick={() => activeTab = TabMode.list}
                >
                    <div class="flex items-center gap-2">
                        {#if [ResourceType.folder, ResourceType.space].includes(resource_type)}
                            <ListOutline size="md" />
                            <p>List view</p>
                        {:else}
                            <EyeSolid size="md" />
                            <p>Content</p>
                        {/if}
                    </div>
                </button>
            </li>
            <li class="mr-2" role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.entry ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.entry}
                        onclick={() => activeTab = TabMode.entry}
                >
                    <div class="flex items-center gap-2">
                        <EditOutline size="md" />
                        <p>Entry</p>
                    </div>
                </button>
            </li>
            <li class="mr-2" role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.form ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.form}
                        onclick={() => activeTab = TabMode.form}
                >
                    <div class="flex items-center gap-2">
                        <RectangleListOutline size="md" />
                        <p>Form</p>
                    </div>
                </button>
            </li>
            {#if resource_type === ResourceType.schema || subpath === "workflows"}
                <li class="mr-2" role="presentation">
                    <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.diagram ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.diagram}
                        onclick={() => activeTab = TabMode.diagram}
                    >
                        <div class="flex items-center gap-2">
                            <DrawSquareSolid size="md" />
                            <p>Diagram</p>
                        </div>
                    </button>
                </li>
            {/if}
            <li class="mr-2" role="presentation">
                <button
                    class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.attachments ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === TabMode.attachments}
                    onclick={() => activeTab = TabMode.attachments}>
                    <div class="flex items-center gap-2">
                        <PaperClipOutline size="md" />
                        <p>Attachments {Object.values(entry.attachments).flat(1).length ? `(${Object.values(entry.attachments).flat(1).length})` : ""}</p>
                    </div>
                </button>
            </li>
            <li role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.history ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.history}
                        onclick={() => activeTab = TabMode.history}
                >
                    <div class="flex items-center gap-2">
                        <ClockOutline size="md" />
                        <p>History</p>
                    </div>
                </button>
            </li>
            {#if canUpdate}
                <li class="ml-auto" role="presentation">
                    <button
                            class="inline-flex items-center p-4 border-b-2 rounded-t-lg border-transparent hover:text-primary hover:border-primary"
                            type="button"
                            onclick={handleSave}
                            disabled={isActionLoading || !isJEDirty}
                            style={isActionLoading || !isJEDirty ? "cursor: not-allowed" : "cursor: pointer"}
                            title="Save changes">
                        <div class="flex items-center gap-2">
                            <FloppyDiskOutline size="md" class="text-primary" />
                            <p class="text-primary">Save</p>
                        </div>
                    </button>
                </li>
            {/if}
            {#if canDelete}
                <li role="presentation">
                    <button
                            class="inline-flex items-center p-4 border-b-2 rounded-t-lg border-transparent hover:text-red-600 hover:border-red-600"
                            type="button"
                            disabled={isActionLoading}
                            style={isActionLoading ? "cursor: not-allowed" : "cursor: pointer"}
                            onclick={deleteCurrentEntryModal}
                            title="Delete this entry">
                        <div class="flex items-center gap-2">
                            <TrashBinOutline size="md" class="text-red-500" />
                            <p class="text-red-500">Delete</p>
                        </div>
                    </button>
                </li>
            {/if}
            <li role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg border-transparent hover:text-primary hover:border-primary"
                        type="button"
                        onclick={handleRefresh}
                        disabled={isRefreshLoading}
                        style={isRefreshLoading ? "cursor: not-allowed" : "cursor: pointer"}
                        title="Save changes">
                    <div class="flex items-center gap-2">
                        <RefreshOutline size="md" class="text-primary" />
                        <p class="text-primary">Refresh</p>
                    </div>
                </button>
            </li>
        </ul>
    </div>

    <div class="mt-2">
        <div class={activeTab === TabMode.list ? '' : 'hidden'} role="tabpanel">
            {#if [ResourceType.folder, ResourceType.space].includes(resource_type)}
                <ListView
                    {space_name}
                    {subpath}
                    folderColumns={entry?.payload?.body?.index_attributes ?? null}
                    sort_by={entry?.payload?.body?.sort_by ?? null}
                    sort_order={entry?.payload?.body?.sort_type ?? null}
                    {canDelete}
                />
            {:else}
                <Table2Cols entry={{ "Resource type": resource_type, ...entry }}/>
            {/if}
        </div>

        <div class={activeTab === TabMode.entry ? '' : 'hidden'} role="tabpanel">
            {#if jeContent.text || jeContent.json}
                <JSONEditor bind:content={jeContent} mode={Mode.text} />
            {/if}
            {#if errorMessage}
                <div class="overflow-auto">
                    <Prism code={errorMessage} />
                </div>
            {/if}
        </div>

        <div class={activeTab === TabMode.form ? '' : 'hidden'} role="tabpanel">
            {#key coinTriggerRefresh}
                {#if jeContent.json}
                    <MetaForm bind:formData={jeContent.json} bind:validateFn={validateMetaForm} />
                    {#if resource_type === ResourceType.user}
                        <MetaUserForm bind:formData={jeContent.json} bind:validateFn={validateRTForm}/>
                    {:else if resource_type === ResourceType.role}
                        <MetaRoleForm bind:formData={jeContent.json} bind:validateFn={validateRTForm} />
                    {:else if resource_type === ResourceType.permission}
                        <MetaPermissionForm bind:formData={jeContent.json} bind:validateFn={validateRTForm} />
                    {:else if resource_type === ResourceType.ticket}
                        <MetaTicketForm {space_name} meta={jeContent.json} bind:formData={ticketData} {progressTicket} />
                    {/if}
                    {#if jeContent?.json?.payload?.body}
                        {#if resource_type === ResourceType.schema}
                            <SchemaForm bind:content={jeContent.json.payload.body}  />
                        {:else if resource_type === ResourceType.folder}
                            <FolderForm bind:content={jeContent.json.payload.body} />
                        {:else if resource_type === ResourceType.content && subpath === "workflows"}
                            <WorkflowForm bind:content={jeContent.json.payload.body} />
                        {:else}
                            {#if schemaShortname}
                                <!--{#if resource_type === ResourceType.content && schemaShortname === "configuration"}-->
                                <!--    <ConfigForm bind:entries={jeContent.json.payload.body.items}/>-->
                                {#if resource_type === ResourceType.content && schemaShortname === "translation"}
                                    {#await getPayloadSchema()}
                                        <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
                                    {:then schema}
                                        <TranslationForm
                                            bind:entries={jeContent.json.payload.body}
                                            columns={Object.keys(schema.payload.body.properties.items.items.properties)}
                                        />
                                    {/await}
                                {:else}
                                    {#await getPayloadSchema()}
                                        <CardPlaceholder size="md" class="mt-8" />
                                    {:then schema}
                                        <DynamicSchemaBasedForms
                                                schema={schema.payload.body}
                                                bind:content={jeContent.json.payload.body}
                                        />
                                    {/await}
                                {/if}
                            {/if}
                        {/if}
                    {/if}
                {/if}
                {#if errorMessage}
                    <div class="overflow-auto">
                        <Prism code={errorMessage} />
                    </div>
                {/if}
            {/key}
        </div>

        {#if resource_type === ResourceType.schema || subpath === "workflows"}
            <div class={activeTab === TabMode.diagram ? '' : 'hidden'} role="tabpanel">
                {#if resource_type === ResourceType.schema}
                    <SchemaDiagram
                            shortname={entry.shortname}
                            properties={entry.payload.body.properties}
                    />
                {/if}
                {#if subpath === "workflows"}
                    <WorkflowDiagram  shortname={entry.shortname} workflowContent={entry?.payload?.body} />
                {/if}
            </div>
        {/if}

        <div class={activeTab === TabMode.attachments ? '' : 'hidden'} role="tabpanel">
            <Attachments {resource_type}
                         {space_name}
                         {subpath}
                         parent_shortname={entry.shortname}
                         attachments={$state.snapshot(entry).attachments}
                         {refreshEntry}
            />
        </div>

        <div class={activeTab === TabMode.history ? '' : 'hidden'} role="tabpanel">
            <HistoryListView
                {space_name}
                {subpath}
                shortname={entry.shortname}
            />
        </div>
    </div>
</div>

<Modal bind:open={openDeleteModal} size="md" title="Confirm Deletion">
    <p class="text-center mb-6">
        Are you sure you want to delete <span class="font-bold">{entry.shortname}</span> ({resource_type})?<br>
        This action cannot be undone.
    </p>

    <div class="flex justify-between w-full">
        <Button color="alternative" onclick={() => openDeleteModal = false}>Cancel</Button>
        <Button color="red" onclick={deleteCurrentEntry} disabled={isActionLoading}>{isActionLoading ? "Deleting..." : "Delete"}</Button>
    </div>
</Modal>
