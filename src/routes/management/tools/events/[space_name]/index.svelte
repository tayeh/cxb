<script lang="ts">
  import { QueryType } from "@edraj/tsdmart";
  import ListView from "@/components/management/ListView.svelte";
  import { params } from "@roxi/routify";
  import cols_events from "@/utils/jsons/list_cols_events.json";
</script>

{#key $params.space_name}
  {#if $params.space_name}
    <ListView
      type={QueryType.events}
      space_name={$params.space_name}
      subpath={"/"}
      folderColumns={cols_events}
    />
  {/if}
{/key}
