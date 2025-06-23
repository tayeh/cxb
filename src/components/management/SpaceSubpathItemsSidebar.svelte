<script lang="ts">
    import {
        ListPlaceholder,
        SidebarItem
    } from "flowbite-svelte";
    import {
        ChevronDownOutline,
        ChevronRightOutline,
        FolderOutline,
        CodeForkSolid
    } from "flowbite-svelte-icons";
    import SpacesSubpathItemsSidebar from "./SpacesSubpathItemsSidebar.svelte";
    import {activeRoute} from "@roxi/routify";
    import {params} from "@roxi/routify";
    import {getChildren, getSpaces} from "@/lib/dmart_services";
    import {ResourceType} from "@edraj/tsdmart";
    import {spaces} from "@/stores/management/spaces";

    let {
        spaceName,
    } = $props();

    let spaceDisplayName = $state("");

    // Get space display name
    $effect(() => {
        if (spaceName && $spaces) {
            const space = $spaces.find(space => space.shortname === spaceName);
            if (space && space.attributes?.displayname?.en) {
                spaceDisplayName = space.attributes.displayname.en;
            }
        }
    });

    // Initialize spaces if not already loaded
    $effect(() => {
        if (!$spaces || $spaces.length === 0) {
            getSpaces();
        }
    });

    // State management
    let spaceChildren = $state(new Map());
    let expandedSpaces = $state(new Set());

    // Initialize with root path expanded
    $effect(() => {
        if (spaceName) {
            // Expand root path
            expandedSpaces.add(`${spaceName}:/`);
            loadChildren(spaceName, "/").then(() => {
                // Auto-expand first level subpaths
                const rootChildren = getChildrenForSpace(spaceName, "/");
                rootChildren.forEach(child => {
                    const childPath = `/${child.shortname}`;
                    expandedSpaces.add(`${spaceName}:${childPath}`);
                    loadChildren(spaceName, childPath);
                });
                expandedSpaces = $state.snapshot(expandedSpaces);
            });
        }
    });

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

    function preventAndHandleToggleExpanded(node, path) {
        const handleEvent = (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleExpanded(spaceName, path);
        };

        node.addEventListener('click', handleEvent);

        return {
            destroy() {
                node.removeEventListener('click', handleEvent);
            }
        };
    }

    function isCurrentPath(path) {
        return `/${$activeRoute.params.subpath}` === path;
    }

    function isCurrentSpace() {
        return $activeRoute.params.space_name === spaceName;
    }
</script>

<div class="sidebar-container">
    <!-- Space name as first item -->
    <SidebarItem
        label={spaceDisplayName || spaceName}
        href={`/management/content/${spaceName}`}
        class="flex-1 whitespace-nowrap {isCurrentSpace() ? 'bg-gray-300 text-white' : ''}"
        style="margin-left: 0px;">
        {#snippet icon()}
            <div class="flex items-center gap-2">
                <CodeForkSolid
                    size="md"
                    class="text-gray-500"
                    style="transform: rotate(180deg); position: relative; z-index: 5;"
                />
            </div>
        {/snippet}
    </SidebarItem>

    <!-- Root level subpaths (always expanded) -->
    {#await loadChildren(spaceName, "/")}
        <div style="margin-left: 20px;">
            <ListPlaceholder />
        </div>
    {:then children}
        {#each getChildrenForSpace(spaceName, "/") as child (child.shortname)}
            <SidebarItem
                label={child.attributes?.displayname?.en || child.shortname}
                href={`/management/content/${spaceName}/${child.shortname}`}
                class="flex-1 whitespace-nowrap {isCurrentPath(`/${child.shortname}`) ? 'bg-gray-300 text-white' : ''}"
                style="margin-left: 20px;">
                {#snippet icon()}
                    <div class="flex items-center gap-2">
                        <button class="p-1 rounded" use:preventAndHandleToggleExpanded={`/${child.shortname}`}>
                            {#if isExpanded(spaceName, `/${child.shortname}`)}
                                <ChevronDownOutline size="sm" />
                            {:else}
                                <ChevronRightOutline size="sm" />
                            {/if}
                        </button>

                        <div>
                            <FolderOutline
                                size="md"
                                class="text-gray-500"
                                style="transform: rotate(180deg); position: relative; z-index: 5;"
                            />
                        </div>
                    </div>
                {/snippet}
            </SidebarItem>

            <!-- Subsubpaths (expandable/collapsible) -->
            {#if isExpanded(spaceName, `/${child.shortname}`)}
                {#await loadChildren(spaceName, `/${child.shortname}`)}
                    <div style="margin-left: 40px;">
                        <ListPlaceholder />
                    </div>
                {:then subchildren}
                    {#each getChildrenForSpace(spaceName, `/${child.shortname}`) as subchild (subchild.shortname)}
                        <SpacesSubpathItemsSidebar
                            {spaceName}
                            parentPath={`/${child.shortname}`}
                            item={subchild}
                            depth={2}
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
        {/each}
    {/await}
</div>
