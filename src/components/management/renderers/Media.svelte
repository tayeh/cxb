<script lang="ts">
  import {ContentType, ResourceType} from "@edraj/tsdmart";
  import {marked} from "marked";
  import Prism from "@/components/Prism.svelte";

  export let attributes: any = {};
  export let resource_type: ResourceType;
  export let url: string;
  export let displayname: string = undefined;
  let content_type: string = attributes?.payload?.content_type || "";
  let body: any = attributes?.payload?.body;
</script>

{#if resource_type === ResourceType.comment}
  <div class="h-full w-full">
    <p style="margin: 0px"><b>State:</b> {attributes.state}</p>
    <br />
    <p style="margin: 0px"><b>Body:</b> {attributes.body}</p>
  </div>
{:else if resource_type === ResourceType.json}
    <div class="h-full w-full">
      <Prism language="json" code={body} />
    </div>
{:else if resource_type === ResourceType.reaction}
  <div>
    <p style="margin: 0px"><b>Type: </b> {attributes.type ?? "N/A"}</p>
  </div>
{:else if content_type.includes("image")}
  {#if url.endsWith('svg')}
    <object data={url} type="image/svg+xml" title="{displayname}">
      <img src={url} alt={displayname} class="mw-100 border" />
    </object>
  {:else}
    <img src={url} alt={displayname} class="mw-100 border" />
  {/if}
{:else if content_type.includes("audio")}
  <audio controls src={url}>
    <track kind="captions" />
  </audio>
{:else if content_type.includes("video")}
  <video controls src={url}>
    <track kind="captions" />
  </video>
{:else if content_type.includes("pdf")}
    <object
      title={displayname}
      class="h-full w-full"
      type="application/pdf"
      data={url}
    >
      <p>For some reason PDF is not rendered here properly.</p>
    </object>
{:else if content_type === ContentType.markdown}

    <iframe class="min-h-dvh w-full p-3 prose font-mono" srcdoc={marked(body)}></iframe>

{:else if ["html", "text"].includes(content_type)}
  <div class="w-full h-full">
    {@html body}
  </div>
{:else}
  <a href={url} title={displayname}
     target="_blank" rel="noopener noreferrer" download>link {displayname}</a>
{/if}
