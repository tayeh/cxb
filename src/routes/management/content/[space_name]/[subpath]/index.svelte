<script lang="ts">
    import { params } from "@roxi/routify";
    import { Dmart, ResourceType } from "@edraj/tsdmart";
    import EntryRenderer from "@/components/management/renderers/EntryRenderer.svelte";
    import {ListPlaceholder,Alert} from "flowbite-svelte";

    let _parent_subpath = $derived($params.subpath.split("-"))
    let parent_subpath: string = $derived(
        _parent_subpath.slice(0, _parent_subpath.length - 1).join("/") || "__root__"
    );
    let shortname: string =  $derived(_parent_subpath[_parent_subpath.length - 1]);
</script>

{#if $params.space_name}
    {#await Dmart.retrieve_entry(ResourceType.folder, $params.space_name, parent_subpath, shortname, true, true)}
        <div class="flex flex-col w-full">
            <ListPlaceholder class="m-5" size="lg" style="width: 100vw"/>
        </div>
    {:then entry}
        <EntryRenderer
            {entry}
            resource_type={ResourceType.folder}
            space_name={$params.space_name}
            subpath={$params.subpath.replaceAll("-", "/")}
        />
    {:catch error}
            <div class="w-full">
                <Alert color="red" class="text-lg flex h-12 m-6 p-3 flex-row justify-center items-center">
                    {error}
                </Alert>
            </div>
    {/await}
{:else}
    <h4>For some reason ... params doesn't have the needed info</h4>
    <pre>{JSON.stringify($params, null, 2)}</pre>
{/if}
