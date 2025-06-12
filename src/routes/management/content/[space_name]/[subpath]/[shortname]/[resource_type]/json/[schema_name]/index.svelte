<script lang="ts">
  import { params } from "@roxi/routify";
  import { Dmart, ResourceType } from "@edraj/tsdmart";
  import EntryRenderer from "@/components/management/renderers/EntryRenderer.svelte";
  import {TextPlaceholder} from "flowbite-svelte";

  const resource_type: ResourceType = ResourceType[$params.resource_type];
</script>

{#if $params.space_name && $params.subpath && $params.shortname}
  {#await Dmart.retrieve_entry(resource_type, $params.space_name, $params.subpath.replaceAll("-", "/"), $params.shortname, true, true, $params.validate_schema === "false" ? false : true)}
    <div class="flex flex-col w-full">
      <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
      <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
      <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
    </div>
  {:then entry}
    <EntryRenderer
      {entry}
      {resource_type}
      space_name={$params.space_name}
      subpath={$params.subpath?.replaceAll("-", "/")}
      schema_name={$params.schema_name}
    />
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
{:else}
  <h4>We shouldn't be here ...</h4>
  <pre>{JSON.stringify($params)}</pre>
{/if}
