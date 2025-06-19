<script lang="ts">
    import {
        ListPlaceholder,
        SidebarItem
    } from "flowbite-svelte";
    import {
        ChevronDownOutline,
        ChevronRightOutline,
        FolderOutline
    } from "flowbite-svelte-icons";
    import SpacesSubpathItemsSidebar from "./SpacesSubpathItemsSidebar.svelte";

    let {
        spaceName,
        parentPath,
        item,
        depth = 0,
        spaceChildren,
        expandedSpaces,
        loadChildren,
        toggleExpanded,
        isExpanded,
        getChildrenForSpace,
    } = $props();

    function getCurrentPath() {
        return `${parentPath}/${item.shortname}`.replace(/\/+/g, '/');
    }

    async function handleToggleExpanded() {
        await toggleExpanded(spaceName, getCurrentPath());
    }

    function getIsExpanded() {
        return isExpanded(spaceName, getCurrentPath());
    }

    function getCurrentChildren() {
        return getChildrenForSpace(spaceName, getCurrentPath());
    }

    export function preventAndHandleToggleExpanded(node: HTMLElement) {
        const handleEvent = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            handleToggleExpanded()
        };

        node.addEventListener('click', handleEvent);

        return {
            destroy() {
                node.removeEventListener('click', handleEvent);
            }
        };
    }

    function isCurrentPath() {
        const currentPath = window.location.pathname || '';
        return currentPath.includes(`/management/content/${spaceName}${getCurrentPath()}`);
    }
</script>

<SidebarItem
        label={item.attributes?.displayname?.en || item.shortname}
        href={`/management/content/${spaceName}${getCurrentPath()}`}
        class="flex-1 whitespace-nowrap {isCurrentPath() ? 'bg-gray-300 text-white' : ''}"
        style="margin-left: {depth * 20}px;">
    {#snippet icon()}
        <div class="flex items-center gap-2">
            <!-- Expand/collapse button for nested items -->
            <button
                class="p-1 hover:bg-gray-200 rounded"
                use:preventAndHandleToggleExpanded
            >
                {#if getIsExpanded()}
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

<!-- Render nested children if expanded -->
{#if getIsExpanded()}
    {#await loadChildren(spaceName, getCurrentPath())}
        <div style="margin-left: {(depth + 1) * 20}px;">
            <ListPlaceholder />
        </div>
    {:then children}
        {#each getCurrentChildren() as child (child.shortname)}
            <SpacesSubpathItemsSidebar
                    {spaceName}
                    parentPath={getCurrentPath()}
                    item={child}
                    depth={depth + 1}
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