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
        TrashBinSolid,
        RefreshOutline,
    } from "flowbite-svelte-icons";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";
    import {Level, showToast} from "@/utils/toast";
    import Prism from "@/components/Prism.svelte";
    import Table2Cols from "@/components/management/Table2Cols.svelte";
    import Attachments from "@/components/management/renderers/Attachments.svelte";
    import BreadCrumbLite from "@/components/management/BreadCrumbLite.svelte";
    import {currentEntry, currentListView, InputMode, spaceChildren} from "@/stores/global";
    import MetaForm from "@/components/management/forms/MetaForm.svelte";
    import MetaUserForm from "@/components/management/forms/MetaUserForm.svelte";
    import MetaRoleForm from "@/components/management/forms/MetaRoleForm.svelte";
    import MetaPermissionForm from "@/components/management/forms/MetaPermissionForm.svelte";
    import {untrack} from "svelte";
    import {goto,params} from "@roxi/routify";
    $goto
    import HistoryListView from "@/components/management/HistoryListView.svelte";
    import {removeEmpty} from "@/utils/renderer/schemaEntryRenderer";
    import MetaTicketForm from "@/components/management/forms/MetaTicketForm.svelte";
    import WorkflowDiagram from "@/components/management/diagram/WorkflowDiagram.svelte";
    import SchemaDiagram from "@/components/management/diagram/SchemaDiagram.svelte";
    import {Modal, Button, Card} from "flowbite-svelte";
    import {searchListView} from "@/stores/management/triggers";
    import {isDeepEqual} from "@/utils/compare";
    import {user} from "@/stores/user";
    import PayloadFrom from "@/components/management/forms/PayloadFrom.svelte";
    import {getParentPath} from "@/utils/helpers";
    import {getChildren} from "@/lib/dmart_services";


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
    let selectedInputMode = $state(InputMode.form);
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
    }, 512);
    let isJEDirty = $state(false);

    let ticketData: any = $state({
        action: null,
        resolution: null,
        comment: null,
    });
    let errorMessage = $state(null);

    const isEntryTrash = space_name === "personal" && subpath.startsWith(`people/${$user.shortname}/trash`)

    const canUpdate = checkAccess("update", space_name, subpath, resource_type);
    const canDelete = (()=>{
        if(space_name=== "management" && subpath === "/"){
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
        const normalizedPath = path.replace(/^\/+|\/+$/g, "");
        const parts = normalizedPath.split("/");

        if (parts.length <= 1 || (parts.length === 1 && parts[0] === "")) {
            return "/";
        }

        return "/" + parts.slice(0, -1).join("/");
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
                    attributes: removeEmpty(content)
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

    async function moveToTrash() {
        isActionLoading = true;

        try {
            const moveResourceType = $params.resource_type
                || ($params.subpath && ResourceType.folder)
                || ResourceType.space;
            const moveNewSubpath = moveResourceType === ResourceType.folder
                ? ($params.subpath.split("/").slice(0, -1).join("-") || '/')
                : $params.subpath;
            const moveAttrb = {
                src_space_name: $params.space_name,
                src_subpath: moveNewSubpath,
                src_shortname: entry.shortname,
                dest_space_name: 'personal',
                dest_subpath: `/people/${$user.shortname}/trash/${$params.space_name}/${moveNewSubpath}`.replaceAll('//', '/'),
                dest_shortname: entry.shortname,
            };
            await Dmart.request({
                space_name: $params.space_name,
                request_type: RequestType.move,
                records: [
                    {
                        resource_type: moveResourceType,
                        shortname: entry.shortname,
                        subpath: moveNewSubpath,
                        attributes: moveAttrb,
                    },
                ],
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

    async function refreshEntry() {
        if (resource_type === ResourceType.folder) {
            if(isJEDirty){
                entry = await Dmart.retrieve_entry(resource_type, space_name, getParentPath(subpath), entry.shortname, true, true);
                const children = await getChildren(space_name, getParentPath(subpath), 50, 0, [ResourceType.folder]);
                $spaceChildren.set(`${space_name}:/${getParentPath(subpath)}`.replaceAll('//', '/'), children.records || []);
                $spaceChildren = $spaceChildren;
            }
            await $currentListView.fetchPageRecords();
        } else {
            entry = await Dmart.retrieve_entry(resource_type, space_name, subpath, entry.shortname, true, true);
        }
        jeContent = { json: $state.snapshot(entry) };
        setTimeout(() => {
            originalJeContent = jsonEditorContentParser(
                $state.snapshot(jeContent)
            );
        }, 512);
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
            pendingRefreshAction = async () => {
                await refreshEntry();
            };
            showUnsavedChangesModal = true;
            return;
        }

        await refreshEntry();
    }

    $effect(() => {
        if (jeContent) {
            isJEDirty = !isDeepEqual(
                jsonEditorContentParser($state.snapshot(jeContent)),
                $state.snapshot(originalJeContent)
            );
        }
    });

    function getExactSubpathValue(){
        if(
            space_name === 'personal'
            && subpath.startsWith('people/')
            && subpath.endsWith('/trash')
        ){
            return false;
        }
        return true;
    }

    let showUnsavedChangesModal = $state(false);
    let pendingRefreshAction: (() => void) | null = $state(null);

    function confirmDiscardChanges() {
        showUnsavedChangesModal = false;
        if (pendingRefreshAction) {
            pendingRefreshAction();
            pendingRefreshAction = null;
        }
    }

    function cancelDiscardChanges() {
        showUnsavedChangesModal = false;
        pendingRefreshAction = null;
    }

    function beforeUnload(event: BeforeUnloadEvent) {
        if (isJEDirty) {
            event.preventDefault();
            event.returnValue = true;
        }
    }
</script>

<svelte:window on:beforeunload={beforeUnload}/>


<div class="flex flex-col w-full">
    <BreadCrumbLite
        {space_name}
        {subpath}
        {resource_type}
        schema_name={schemaShortname}
        shortname={entry.shortname}
        payloadContentType={entry?.payload?.content_type}
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
            {#if canDelete && !isEntryTrash}
                <li role="presentation">
                    <button
                            class="inline-flex items-center p-4 border-b-2 rounded-t-lg border-transparent hover:text-red-600 hover:border-red-600"
                            type="button"
                            disabled={isActionLoading}
                            style={isActionLoading ? "cursor: not-allowed" : "cursor: pointer"}
                            onclick={deleteCurrentEntryModal}
                            title="Delete this entry">
                        <div class="flex items-center gap-2">
                            <TrashBinSolid size="md" class="text-red-500" />
                            <p class="text-red-500">Delete</p>
                        </div>
                    </button>
                </li>
                {#if ![ResourceType.space, ResourceType.folder].includes(resource_type)}
                    <li role="presentation">
                        <button
                                class="inline-flex items-center p-4 border-b-2 rounded-t-lg border-transparent hover:text-red-600 hover:border-red-600"
                                type="button"
                                disabled={isActionLoading}
                                style={isActionLoading ? "cursor: not-allowed" : "cursor: pointer"}
                                onclick={moveToTrash}
                                title="Delete this entry">
                            <div class="flex items-center gap-2">
                                <TrashBinOutline size="md" class="text-red-500" />
                                <p class="text-red-500">Trash</p>
                            </div>
                        </button>
                    </li>
                {/if}
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
                    exact_subpath={getExactSubpathValue()}
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
                    <MetaForm bind:formData={jeContent.json} bind:validateFn={validateMetaForm} isCreate={false}/>
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
                        <Card class="p-4 max-w-4xl mx-auto my-2">
                            <h1 class="text-2xl font-bold mb-4">Payload</h1>
                            <PayloadFrom
                                isCreate={false}
                                bind:selectedResourceType={resource_type}
                                selectedSchema={schemaShortname}
                                bind:selectedWorkflow={jeContent.json.workflow_shortname}
                                bind:selectedInputMode={selectedInputMode}
                                bind:contentType={jeContent.json.payload.content_type}
                                bind:content={jeContent.json.payload.body}
                            />
                        </Card>
                        <!--{#if resource_type === ResourceType.schema}-->
                        <!--    <SchemaForm bind:content={jeContent.json.payload.body}  />-->
                        <!--{:else if resource_type === ResourceType.folder}-->
                        <!--    <FolderForm bind:content={jeContent.json.payload.body} />-->
                        <!--{:else if resource_type === ResourceType.content && subpath === "workflows"}-->
                        <!--    <WorkflowForm bind:content={jeContent.json.payload.body} />-->
                        <!--{:else}-->
                        <!--    {#if schemaShortname}-->
                        <!--        &lt;!&ndash;{#if resource_type === ResourceType.content && schemaShortname === "configuration"}&ndash;&gt;-->
                        <!--        &lt;!&ndash;    <ConfigForm bind:entries={jeContent.json.payload.body.items}/>&ndash;&gt;-->
                        <!--        {#if resource_type === ResourceType.content && schemaShortname === "translation"}-->
                        <!--            {#await getPayloadSchema()}-->
                        <!--                <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>-->
                        <!--            {:then schema}-->
                        <!--                <TranslationForm-->
                        <!--                    bind:entries={jeContent.json.payload.body}-->
                        <!--                    columns={Object.keys(schema.payload.body.properties.items.items.properties)}-->
                        <!--                />-->
                        <!--            {/await}-->
                        <!--        {:else}-->
                        <!--            {#await getPayloadSchema()}-->
                        <!--                <CardPlaceholder size="md" class="mt-8" />-->
                        <!--            {:then schema}-->
                        <!--                <DynamicSchemaBasedForms-->
                        <!--                        schema={schema.payload.body}-->
                        <!--                        bind:content={jeContent.json.payload.body}-->
                        <!--                />-->
                        <!--            {/await}-->
                        <!--        {/if}-->
                        <!--    {/if}-->
                        <!--{/if}-->
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
            {#key coinTriggerRefresh}
                <HistoryListView {space_name} {subpath} shortname={entry.shortname} />
            {/key}
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

<Modal bind:open={showUnsavedChangesModal} size="md" title="Unsaved Changes">
    <p class="text-center mb-6">
        You have unsaved changes. Do you want to discard them and refresh?
    </p>

    <div class="flex justify-between w-full">
        <Button color="alternative" onclick={cancelDiscardChanges}>Cancel</Button>
        <Button color="red" onclick={confirmDiscardChanges}>Discard Changes</Button>
    </div>
</Modal>
