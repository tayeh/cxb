<script lang="ts">
    import { params } from "@roxi/routify";
    import { Dmart, ResourceType } from "@edraj/tsdmart";
    import EntryRenderer from "@/components/management/renderers/EntryRenderer.svelte";
    import {TextPlaceholder} from "flowbite-svelte";
</script>

{#if $params.space_name}
    {#await Dmart.retrieve_entry(ResourceType.space, $params.space_name, $params.subpath, $params.shortname, true, true)}
        <div class="flex flex-col w-full">
            <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
            <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
            <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
        </div>
    {:then entry}
        <EntryRenderer
                {entry}
                resource_type={ResourceType.space}
                space_name={$params.space_name}
                subpath={$params.subpath}
        />
    {:catch error}
        <div class="alert alert-danger text-center m-5">
            <h4 class="alert-heading text-capitalize">{error}</h4>
        </div>
    {/await}
{:else}
    <h4>For some reason ... params doesn't have the needed info</h4>
    <pre>{JSON.stringify($params, null, 2)}</pre>
{/if}
