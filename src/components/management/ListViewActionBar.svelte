<script lang="ts">
import {FileCirclePlusOutline,UploadOutline, DownloadOutline,TrashBinOutline} from "flowbite-svelte-icons";
import {Button, Input} from "flowbite-svelte";
import ModalCreateEntry from "@/components/management/Modals/ModalCreateEntry.svelte";

let {space_name,subpath}:{space_name:string,subpath:string} = $props();

let isOpen = $state(false);
</script>

<div class="flex flex-col md:flex-row justify-between items-center my-2 mx-3">
    <div>
        <Input placeholder="Search..."/>
    </div>
    <div>
        <Button class="bg-primary cursor-pointer" size="xs" onclick={() => isOpen = true}>
            <FileCirclePlusOutline size="md"/> Create
        </Button>
        <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline>
            <UploadOutline size="md"/> Upload
        </Button>
        <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline>
            <DownloadOutline size="md"/> Download
        </Button>
        <Button class="text-red-600 cursor-pointer hover:text-red-600" size="xs" outline>
            <TrashBinOutline size="md"/> Delete
        </Button>
    </div>
</div>

<ModalCreateEntry {space_name} {subpath} bind:isOpen={isOpen} />
