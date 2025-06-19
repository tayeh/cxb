<script lang="ts">
    import {
        Button,
        Input,
        ListPlaceholder,
        Modal,
        Sidebar,
        SidebarGroup,
        SidebarItem, Spinner,
    } from "flowbite-svelte";
    import {
        CodeForkSolid,
        ChevronDownOutline,
        ChevronRightOutline,
        PlusOutline
    } from "flowbite-svelte-icons";
    import {spaces} from "@/stores/management/spaces";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import Prism from "@/components/Prism.svelte";
    import {Dmart, RequestType, ResourceType} from "@edraj/tsdmart";
    import {Level, showToast} from "@/utils/toast";
    import {getSpaces, getChildren} from "@/lib/dmart_services";
    import {jsonEditorContentParser} from "@/utils/jsonEditor";
    import SpacesSubpathItemsSidebar from "./SpacesSubpathItemsSidebar.svelte";
    import {url} from "@roxi/routify";
    import MetaForm from "./forms/MetaForm.svelte";
    $url

    let spaceChildren = $state(new Map());
    let expandedSpaces = $state(new Set());


    async function loadChildren(spaceName, subpath = "/") {
        const cacheKey = `${spaceName}:${subpath}`;
        if (!spaceChildren.has(cacheKey)) {
            try {
                const children = await getChildren(spaceName, subpath, 50, 0, [ResourceType.folder]);

                spaceChildren.set(cacheKey, children.records || []);
                spaceChildren = spaceChildren; // Trigger reactivity
            } catch (error) {
                console.error(`Failed to load children for ${spaceName}${subpath}:`, error);
                spaceChildren.set(cacheKey, []);
            }
        }
        return spaceChildren.get(cacheKey) || [];
    }

    async function toggleExpanded(spaceName, subpath = "/") {
        const key = `${spaceName}:${subpath}`;
        if (expandedSpaces.has(key)) {
            expandedSpaces.delete(key);
        } else {
            expandedSpaces.add(key);
            await loadChildren(spaceName, subpath);
        }
        expandedSpaces = $state.snapshot(expandedSpaces);
    }

    function isExpanded(spaceName, subpath = "/") {
        return expandedSpaces.has(`${spaceName}:${subpath}`);
    }

    function getChildrenForSpace(spaceName, subpath = "/") {
        return spaceChildren.get(`${spaceName}:${subpath}`) || [];
    }

    export function preventAndToggleExpanded(node: HTMLElement, spaceShortname: string) {
        const handleEvent = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleExpanded(spaceShortname)
        };

        node.addEventListener('click', handleEvent);

        return {
            destroy() {
                node.removeEventListener('click', handleEvent);
            }
        };
    }
    function preventAndStop(node: any) {
        return (node: HTMLElement) => {
            const handleEvent = (event: Event) => {
                event.preventDefault();
                event.stopPropagation();
            };

            node.addEventListener('click', handleEvent);

            return {
                destroy() {
                    node.removeEventListener('click', handleEvent);
                }
            };
        };
    }


    let viewMetaModal = $state(false);
    let editModal = $state(false);
    let deleteModal = $state(false);
    let addSpaceModal = $state(false);
    let selectedSpace = $state(null);
    let modelError = $state(null);

    let spaceFormData = $state({
        shortname: "",
        is_active: true,
        slug: "",
        displayname: {
            en: "",
            ar: "",
            ku: ""
        },
        description: {
            en: "",
            ar: "",
            ku: ""
        }
    });
    let validateSpaceForm = $state(() => true);

    let isActionLoading = $state(false);

    let jeContent = { json: undefined };

    function showAddSpaceModal() {
        modelError = null;
        spaceFormData = {
            shortname: "",
            is_active: true,
            slug: "",
            displayname: {
                en: "",
                ar: "",
                ku: ""
            },
            description: {
                en: "",
                ar: "",
                ku: ""
            }
        };
        addSpaceModal = true;
    }

    async function createSpace() {
        if (!validateSpaceForm()) {
            return;
        }

        if (spaceFormData.shortname.trim()) {
            try {
                isActionLoading = true;
                modelError = null;
                await Dmart.space({
                    space_name: spaceFormData.shortname.trim(),
                    request_type: RequestType.create,
                    records: [
                        {
                            resource_type: ResourceType.space,
                            shortname: spaceFormData.shortname.trim(),
                            subpath: '/',
                            attributes: {
                                is_active: spaceFormData.is_active,
                                slug: spaceFormData.slug,
                                displayname: spaceFormData.displayname,
                                description: spaceFormData.description
                            }
                        }
                    ]
                });
                showToast(Level.info, `Space "${spaceFormData.shortname.trim()}" created successfully!`);
                await getSpaces();
                addSpaceModal = false;
            } catch (error) {
                modelError = error.response.data;
            } finally {
                isActionLoading = false;
            }
        }
    }

    function viewMeta(event, space) {
        event.preventDefault();
        event.stopPropagation();

        modelError = null;
        selectedSpace = structuredClone(space);
        jeContent = { json: selectedSpace };
        viewMetaModal = true;
    }

    function editSpace(event, space) {
        event.preventDefault();
        event.stopPropagation();

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
                isActionLoading = true;
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
            } finally {
                isActionLoading = false;
            }
        }
    }

    function confirmDelete(event, space) {
        event.preventDefault();
        event.stopPropagation();

        modelError = null;
        selectedSpace = space;
        deleteModal = true;
    }

    async function deleteSpace() {
        if (selectedSpace) {

            try {
                isActionLoading = true;
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
            } finally {
                isActionLoading = false;
            }
        }
    }
    function isCurrentSpace(shortname) {
        const currentPath = window.location.pathname || '';
        return currentPath.endsWith(`/management/content/${shortname}`);
    }
</script>

<Sidebar position="static" class="h-full">
    <SidebarGroup>
        {#if $spaces === null}
            <ListPlaceholder />
        {:else}
            <Button size="md" class="ms-6 bg-primary" style="cursor: pointer" onclick={showAddSpaceModal}>
                <PlusOutline class="flex justify-center h-5 w-6" />Add new space
            </Button>
            {#each $spaces as space (space.shortname)}
                <!-- Main space item -->
                <SidebarItem
                        label={space.attributes?.displayname?.en || space.shortname}
                        href={"/management/content/"+space.shortname}
                        class="flex-1 ms-3 whitespace-nowrap {isCurrentSpace(space.shortname) ? 'bg-gray-300 text-white' : ''}">
                    {#snippet icon()}
                        <div class="flex items-center gap-2">
                            <button
                                class="p-1 hover:bg-gray-200 rounded"
                                use:preventAndToggleExpanded={space.shortname}
                            >
                                {#key expandedSpaces}
                                    {#if isExpanded(space.shortname)}
                                        <ChevronDownOutline size="sm" />
                                    {:else}
                                        <ChevronRightOutline size="sm" />
                                    {/if}
                                {/key}
                            </button>

                            <CodeForkSolid
                                size="md"
                                class="text-gray-500"
                                style="transform: rotate(180deg); position: relative; z-index: 5;"
                            />
                        </div>
                    {/snippet}
                    <!--TODO: fix propagation issue-->
                    {#snippet subtext()}
                    {/snippet}
                    <!--{#snippet subtext()}-->
                    <!--    <div class="flex items-end justify-end w-full">-->
                    <!--        <div class="p-1" style="cursor: pointer; z-index: 10">-->
                    <!--            <Button class="!p-1" color="light" size="xs" onclick={(e) => e.stopPropagation()}>-->
                    <!--                <DotsHorizontalOutline />-->
                    <!--                <Dropdown onclick={(e) => e.stopPropagation()} class="!p-0">-->
                    <!--                    <DropdownItem class="w-full" onclick={(e) => viewMeta(e,space)}>-->
                    <!--                        <div class="flex items-center gap-2">-->
                    <!--                            <EyeSolid size="sm" /> View Meta-->
                    <!--                        </div>-->
                    <!--                    </DropdownItem>-->

                    <!--                    <DropdownItem class="w-full" onclick={(e) => editSpace(e,space)}>-->
                    <!--                        <div class="flex items-center gap-2">-->
                    <!--                            <PenSolid size="sm" /> Edit-->
                    <!--                        </div>-->
                    <!--                    </DropdownItem>-->

                    <!--                    <DropdownItem class="w-full" onclick={(e) => confirmDelete(e,space)}>-->
                    <!--                        <div class="flex items-center gap-2 text-red-600">-->
                    <!--                            <TrashBinSolid size="sm" /> Delete-->
                    <!--                        </div>-->
                    <!--                    </DropdownItem>-->
                    <!--                </Dropdown>-->
                    <!--            </Button>-->
                    <!--        </div>-->
                    <!--    </div>-->
                    <!--{/snippet}-->
                </SidebarItem>

                {#key expandedSpaces}
                    {#if isExpanded(space.shortname)}
                        {#await loadChildren(space.shortname)}
                            <div class="ml-6">
                                <ListPlaceholder />
                            </div>
                        {:then children}
                            {#each getChildrenForSpace(space.shortname) as child (child.shortname)}
                                <SpacesSubpathItemsSidebar
                                        spaceName={space.shortname}
                                        parentPath="/"
                                        item={child}
                                        depth={1}
                                        {spaceChildren}
                                        {expandedSpaces}
                                        {loadChildren}
                                        {toggleExpanded}
                                        {isExpanded}
                                        {getChildrenForSpace}
                                />
                            {/each}
                        {/await}
                    {/if}
                {/key}
            {/each}
        {/if}
    </SidebarGroup>
</Sidebar>


<Modal bind:open={addSpaceModal} size="xl" title="Add New Space">
    <div class="space-y-4">
        <MetaForm bind:formData={spaceFormData} bind:validateFn={validateSpaceForm} />

        {#if modelError}
            <div class="mt-4">
                <p class="text-red-600 font-medium mb-2">Error:</p>
                <div class="max-h-60 overflow-auto">
                    <Prism code={modelError} />
                </div>
            </div>
        {/if}
    </div>

    <div class="flex justify-between w-full mt-4">
        <Button color="alternative" onclick={() => addSpaceModal = false}>Cancel</Button>
        <Button class="bg-primary" onclick={createSpace}>
            {#if isActionLoading}
                <Spinner class="me-3" size="4" color="blue" />
                Creating ...
            {:else}
                Create
            {/if}
        </Button>
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
        <Button class="bg-primary" onclick={saveChanges}>
            {#if isActionLoading}
                <Spinner class="me-3" size="4" color="blue" />
                Saving Changes ...
            {:else}
                Save Changes
            {/if}
        </Button>
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
        <Button color="red" onclick={deleteSpace}>
            {#if isActionLoading}
                <Spinner class="me-3" size="4" color="blue" />
                Deleting ...
            {:else}
                Delete
            {/if}
        </Button>

    </div>
</Modal>
