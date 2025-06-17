<script lang="ts">
    import {
        Button,
        Dropdown,
        DropdownItem, Input, ListPlaceholder, Modal,
        Sidebar,
        SidebarGroup,
        SidebarItem,
        SidebarWrapper,
        uiHelpers
    } from "flowbite-svelte";
    import {CodeForkSolid, DotsHorizontalOutline, EyeSolid, PenSolid, TrashBinSolid} from "flowbite-svelte-icons";
    import {spaces} from "@/stores/management/spaces";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import Prism from "@/components/Prism.svelte";
    import {Dmart, RequestType, ResourceType} from "@edraj/tsdmart";
    import {Level, showToast} from "@/utils/toast";
    import {getChildren, getSpaces} from "@/lib/dmart_services";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";

    let viewMetaModal = false;
    let editModal = false;
    let deleteModal = false;
    let addSpaceModal = false;
    let selectedSpace = null;
    let modelError = null;
    let newSpaceShortname = "";

    let jeContent = { json: undefined };

    function showAddSpaceModal() {
        modelError = null;
        newSpaceShortname = "";
        addSpaceModal = true;
    }

    async function createSpace() {
        if (newSpaceShortname.trim()) {
            try {
                modelError = null;
                await Dmart.space({
                    space_name: newSpaceShortname.trim(),
                    request_type: RequestType.create,
                    records: [
                        {
                            resource_type: ResourceType.space,
                            shortname: newSpaceShortname.trim(),
                            subpath: '/',
                            attributes: {}
                        }
                    ]
                });
                showToast(Level.info, `Space "${newSpaceShortname.trim()}" created successfully!`);
                addSpaceModal = false;
                await getSpaces();
            } catch (error) {
                modelError = error.response.data;
            }
        }
    }

    function viewMeta(space) {
        modelError = null;
        selectedSpace = structuredClone(space);
        jeContent = { json: selectedSpace };
        viewMetaModal = true;
    }

    function editSpace(space) {
        modelError = null;
        selectedSpace = structuredClone(space);
        jeContent = { json: selectedSpace };
        editModal = true;
    }

    async function saveChanges() {
        if (selectedSpace) {
            const record = jsonEditorContentParser(jeContent);
            delete record.uuid;
            try {
                modelError = null;
                await Dmart.request({
                    space_name: selectedSpace.shortname,
                    request_type: RequestType.replace,
                    records: [
                        {
                            resource_type: ResourceType.space,
                            shortname: selectedSpace.shortname,
                            subpath: '/',
                            attributes: record.attributes
                        }
                    ]
                })
                editModal = false;
                showToast(Level.info, `Space "${selectedSpace.shortname}" updated successfully!`);
                await getSpaces();
            } catch (error) {
                modelError = error;
            }
        }
    }

    function confirmDelete(space) {
        modelError = null;
        selectedSpace = space;
        deleteModal = true;
    }

    async function deleteSpace() {
        if (selectedSpace) {
            try {
                modelError = null;
                await Dmart.request({
                    space_name: selectedSpace.shortname,
                    request_type: RequestType.delete,
                    records: [{
                        resource_type: ResourceType.space,
                        shortname: selectedSpace.shortname,
                        subpath: '/',
                        attributes: {}
                    }]
                })
                showToast(Level.info, `Space "${selectedSpace.shortname}" has been deleted successfully!`);
                deleteModal = false;
                selectedSpace = null;
                await getSpaces();
            } catch (error) {
                modelError = error;
            }
        }
    }

    async function handleClickSpace(space) {
        await getChildren(space.shortname, '/')
    }

    export function preventAndStop(node: HTMLElement, space: any) {
        const handleEvent = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            handleClickSpace(space);
        };
        node.addEventListener('click', handleEvent);

        return {
            destroy() {
                node.removeEventListener('click', handleEvent);
            }
        };
    }
</script>

<Sidebar position="static" class="h-full">
    <SidebarGroup>
        {#if $spaces === null}
            <ListPlaceholder />
        {:else}
            {#each $spaces as space (space.shortname)}
                <SidebarItem label={space.attributes?.displayname?.en || space.shortname}
                             href={"/management/content/"+space.shortname}
                             class="flex-1 ms-3 whitespace-nowrap">
                    {#snippet icon()}
                        <div use:preventAndStop={space}>
                        <CodeForkSolid
                            size="md"
                            class="text-gray-500"
                            style="transform: rotate(180deg); position: relative; z-index: 5;"
                        />
                        </div>
                    {/snippet}
                    {#snippet subtext()}
                        <div class="flex items-end justify-end w-full">
                            <div class="p-1" style="cursor: pointer; z-index: 10">
                                <Button class="!p-1" color="light">
                                    <DotsHorizontalOutline />
                                    <Dropdown simple>
                                        <DropdownItem class="w-full" onclick={() => viewMeta(space)}>
                                            <div class="flex items-center gap-2">
                                                <EyeSolid size="sm" /> View Meta
                                            </div>
                                        </DropdownItem>
                                        <DropdownItem class="w-full" onclick={() => editSpace(space)}>
                                            <div class="flex items-center gap-2">
                                                <PenSolid size="sm" /> Edit
                                            </div>
                                        </DropdownItem>
                                        <DropdownItem class="w-full" onclick={() => confirmDelete(space)}>
                                            <div class="flex items-center gap-2 text-red-600">
                                                <TrashBinSolid size="sm" /> Delete
                                            </div>
                                        </DropdownItem>
                                    </Dropdown>
                                </Button>
                            </div>
                        </div>
                    {/snippet}
                </SidebarItem>
            {/each}
        {/if}
    </SidebarGroup>
</Sidebar>


<Modal bind:open={addSpaceModal} size="md" title="Add New Space">
    <div class="space-y-4">
        <label class="block text-sm font-medium text-gray-700">Shortname</label>
        <Input type="text" placeholder="Enter space shortname" bind:value={newSpaceShortname} />

        {#if modelError}
            <div class="mt-4">
                <p class="text-red-600 font-medium mb-2">Error:</p>
                <div class="max-h-60 overflow-auto">
                    <Prism code={modelError} />
                </div>
            </div>
        {/if}
    </div>

    <div class="flex justify-between w-full">
        <Button color="alternative" onclick={() => addSpaceModal = false}>Cancel</Button>
        <Button class="bg-primary" onclick={createSpace}>Create</Button>
    </div>
</Modal>

<Modal bind:open={viewMetaModal} size="xl" title="Space Metadata" autoclose>
    <div>
        {#if selectedSpace}
            <JSONEditor content={jeContent} readOnly={true} />
        {/if}
    </div>
</Modal>

<Modal bind:open={editModal} size="xl" title="Edit Space">
    <div>
        {#if selectedSpace}
            <JSONEditor bind:content={jeContent} readOnly={false} mode={Mode.text} />
        {/if}

        {#if modelError}
            <div class="mt-4">
                <p class="text-red-600 font-medium mb-2">Error:</p>
                <div class="max-h-60 overflow-auto">
                    <Prism code={modelError} />
                </div>
            </div>
        {/if}
    </div>
    <div class="flex justify-between w-full">
        <Button color="alternative" onclick={() => editModal = false}>Cancel</Button>
        <Button class="bg-primary" onclick={saveChanges}>Save Changes</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal} size="md" title="Confirm Deletion">
    {#if selectedSpace}
        <p class="text-center mb-6">
            Are you sure you want to delete the space <span class="font-bold">{selectedSpace.shortname}</span>?<br>
            This action cannot be undone.
        </p>
    {/if}

    {#if modelError}
        <div class="mt-4">
            <p class="text-red-600 font-medium mb-2">Error:</p>
            <div class="max-h-60 overflow-auto">
                <Prism code={modelError} />
            </div>
        </div>
    {/if}

    <div class="flex justify-between w-full">
        <Button color="alternative" onclick={() => deleteModal = false}>Cancel</Button>
        <Button color="red" onclick={deleteSpace}>Delete</Button>
    </div>
</Modal>