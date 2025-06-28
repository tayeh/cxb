<script lang="ts">
import {Button,Modal} from "flowbite-svelte";
import Media from "@/components/management/renderers/Media.svelte";
import {Dmart, ResourceType} from "@edraj/tsdmart";
import {getFileExtension} from "@/utils/getFileExtension";

let {
    space_name, subpath, parent_shortname,
    openViewContentModal = $bindable(), selectedAttachment
}:{
    space_name:string, subpath:string, parent_shortname:string,
    openViewContentModal:boolean,selectedAttachment:any
} = $props();
</script>

<Modal
    class=""
    bodyClass="justify-center"
    bind:open={openViewContentModal}
    size="lg"
>
    <div class="modal-header">
        <h5 class="modal-title">
            {selectedAttachment?.attributes?.displayname?.en || selectedAttachment?.shortname || "Attachment Content"}
        </h5>
        <button type="button" onclick={() => openViewContentModal = false} class="btn-close" aria-label="Close">
        </button>
    </div>

    {#if selectedAttachment}
        <div class="flex justify-center align-center h-full w-full border-2 rounded-2xl p-3">
            <Media
            resource_type={ResourceType[selectedAttachment.resource_type]}
            attributes={selectedAttachment.attributes}
            displayname={selectedAttachment.shortname}
            url={Dmart.get_attachment_url(
            selectedAttachment.resource_type,
            space_name,
            subpath,
            parent_shortname,
            selectedAttachment.shortname,
            getFileExtension(selectedAttachment.attributes?.payload?.body)
          )}
            />
        </div>
    {/if}
</Modal>