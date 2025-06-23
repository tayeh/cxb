<script>
    import SpacesSidebar from "@/components/management/SpacesSidebar.svelte";
    import SpaceSubpathItemsSidebar from "@/components/management/SpaceSubpathItemsSidebar.svelte";
</script>

<div class="h-svh flex gap-1">
    <div class="w-64 border-r border-gray-200">
        <SpaceSubpathItemsSidebar />
    </div>

    <div class="flex-1 overflow-auto">
        <slot />
    </div>
</div>
