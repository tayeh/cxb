<script>
    import SpacesSidebar from "@/components/management/SpacesSidebar.svelte";
    import SpacesSubpathItemsSidebar from "@/components/management/SpacesSubpathItemsSidebar.svelte";
    import SpaceSubpathItemsSidebar from "@/components/management/SpaceSubpathItemsSidebar.svelte";
    import {params} from "@roxi/routify";

    let spaceChildren = $state(new Map());
    function getChildrenForSpace(spaceName, subpath = "/") {
        return spaceChildren.get(`${spaceName}:${subpath}`) || [];
    }
</script>

<div class="h-svh flex gap-1">
    <div class="w-64 border-r border-gray-200">
<!--        <SpaceSubpathItemsSidebar spaceName={$params.space_name} />-->
    </div>

    <div class="flex-1 overflow-auto">
        <slot />
    </div>
</div>
