<script lang="ts">
    import ListView from "@/components/management/ListView.svelte";
    import {Dmart, RequestType, ResourceType, type ResponseEntry} from "@edraj/tsdmart";
    import {checkAccess} from "@/utils/checkAccess";
    import {
        ClockOutline,
        EditOutline,
        EyeSolid,
        FloppyDiskOutline,
        ListOutline,
        PaperClipOutline,
        RectangleListOutline,
        TrashBinOutline,
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
    import {onMount, untrack} from "svelte";
    import {goto} from "@roxi/routify";
    import {getSpaces} from "@/lib/dmart_services";
    import HistoryListView from "@/components/management/HistoryListView.svelte";
    import SchemaForm from "@/components/management/forms/SchemaForm.svelte";
    import FolderForm from "@/components/management/forms/FolderForm.svelte";
    import {removeEmpty} from "@/utils/renderer/schemaEntryRenderer";
    import WorkflowForm from "@/components/management/forms/WorkflowForm.svelte";
    import MetaTicketForm from "@/components/management/forms/MetaTicketForm.svelte";
    $goto

    enum TabMode {
        list = 0,
        entry = 1,
        form = 2,
        attachments = 3,
        history = 4
    }

    let {
        entry = $bindable(),
        space_name,
        subpath,
        resource_type,
        schema_name = null,
    }: {
        entry: ResponseEntry,
        space_name: string,
        subpath: string,
        resource_type: ResourceType,
        schema_name?: string | null,
    } = $props();

    currentEntry.set({
        entry,
        refreshEntry
    });

    let jeContent: any = $state({ json: structuredClone(entry) });
    let jePayload: any = $state(null);
    let errorMessage = $state(null);

    onMount(() => {
        if(entry.payload) {
            if (entry.payload.content_type === "json") {
                jePayload = {json: entry.payload.body};
            } else {
                jePayload = entry.payload.body;
            }
        }
    })

    const canUpdate = checkAccess("update", space_name, subpath, resource_type);
    const canDelete = !(space_name === "management" && subpath === "/")
        && checkAccess("delete", space_name, subpath, resource_type);
    let allowedResourceTypes = $state([ResourceType.content]);

    let activeTab: TabMode = $state(TabMode.list);
    let isActionLoading = $state(false);
    let validateMetaForm;
    let validateRTForm;
    async function handleSave(){
        isActionLoading = true;
        const content = jsonEditorContentParser($state.snapshot(jeContent));

        const shortname = content.shortname;
        delete content.uuid;
        delete content.shortname;

        if (resource_type === ResourceType.schema) {
            content.payload.body = removeEmpty(jePayload.json);
        } else if(resource_type === ResourceType.content && subpath === "workflows") {
            content.payload = {
                body: removeEmpty(jsonEditorContentParser($state.snapshot(jePayload))),
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
                    subpath: subpath,
                    attributes: content
                }]
            })
            showToast(Level.info, `Entry has been updated successfully!`);
            await refreshEntry();
        } catch (error) {
            errorMessage = error.response.data;
        } finally {
            isActionLoading = false;
        }
    }

    async function deleteCurrentEntry() {
        isActionLoading = true;
        if (!confirm(`Are you sure you want to delete '${entry.shortname}' (${resource_type})?`)) {
            return;
        }

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

    function handleRenderMenu(
        items: any,
        context: { mode: "tree" | "text" | "table"; modal: boolean }
    ) {
        return items.concat([
            {
                onClick: handleSave,
                icon: {
                    prefix: 'prefix',
                    iconName: 'iconName',
                    icon: [
                        448,
                        512,
                        [128190,128426,"save"],
                        'f0c7',
                        'M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z'
                    ]
                },
                title: "Save",
            }
        ]);
    }

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
        currentEntry.set({
            entry,
            refreshEntry
        });
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
</script>



<div class="flex flex-col w-full">
    <BreadCrumbLite
        {space_name}
        {subpath}
        {resource_type}
        {schema_name}
        shortname={entry.shortname}
    />

    <!-- Tab navigation -->
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
            <li class="mr-2" role="presentation">
                <button
                        class="inline-flex items-center p-4 border-b-2 rounded-t-lg {activeTab === TabMode.attachments ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}"
                        type="button"
                        role="tab"
                        aria-selected={activeTab === TabMode.attachments}
                        onclick={() => activeTab = TabMode.attachments}
                >
                    <div class="flex items-center gap-2">
                        <PaperClipOutline size="md" />
                        <p>Attachments</p>
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
                            disabled={isActionLoading}
                            style={isActionLoading ? "cursor: not-allowed" : "cursor: pointer"}
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
                            onclick={deleteCurrentEntry}
                            title="Delete this entry">
                        <div class="flex items-center gap-2">
                            <TrashBinOutline size="md" class="text-red-500" />
                            <p class="text-red-500">Delete</p>
                        </div>
                    </button>
                </li>
            {/if}
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
            {#if jeContent.text}
                <JSONEditor bind:content={jeContent} mode={Mode.text} onRenderMenu={handleRenderMenu} />
            {/if}
            {#if errorMessage}
                <div class="overflow-auto">
                    <Prism code={errorMessage} />
                </div>
            {/if}
        </div>
        <div class={activeTab === TabMode.form ? '' : 'hidden'} role="tabpanel">
            {#if jeContent.json}
                <MetaForm bind:formData={jeContent.json} bind:validateFn={validateMetaForm} />
                {#if resource_type === ResourceType.user}
                    <MetaUserForm bind:formData={jeContent.json} bind:validateFn={validateRTForm}/>
                {:else if resource_type === ResourceType.role}
                    <MetaRoleForm bind:formData={jeContent.json} bind:validateFn={validateRTForm} />
                {:else if resource_type === ResourceType.permission}
                    <MetaPermissionForm bind:formData={jeContent.json} bind:validateFn={validateRTForm} />
                {:else if resource_type === ResourceType.ticket}
                    <MetaTicketForm bind:formData={jeContent.json} bind:validateFn={validateRTForm} />
                {/if}
                {#if jePayload}
                    {#if resource_type === ResourceType.schema}
                        <SchemaForm bind:content={jePayload.json}  />
                    {:else if resource_type === ResourceType.folder}
                        <FolderForm bind:content={jePayload.json} />
                    {:else if resource_type === ResourceType.content && subpath === "workflows"}
                        <WorkflowForm bind:content={jePayload.json} />
                    {/if}
                {/if}

            {/if}
            {#if errorMessage}
                <div class="overflow-auto">
                    <Prism code={errorMessage} />
                </div>
            {/if}
        </div>

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