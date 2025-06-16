<script lang="ts">
import {FileCirclePlusOutline,UploadOutline, DownloadOutline,TrashBinOutline} from "flowbite-svelte-icons";
import {Button, Input} from "flowbite-svelte";
import ModalCreateEntry from "@/components/management/Modals/ModalCreateEntry.svelte";
import {onMount} from "svelte";
import {checkAccess} from "@/utils/checkAccess";
import {subpathInManagementNoAction} from "@/stores/global";

let {space_name,subpath}:{space_name:string,subpath:string} = $props();

let canCreate = $state(false);
let canUploadCSV = $state(false);
let canDownloadCSV = $state(false);
let canDelete = $state(false);

onMount(() => {
    // Check if the user has permission to create entries in the specified space and subpath
    if(space_name === "management" && subpath === "/") {
        canCreate = false;
        canDelete = false;
        canUploadCSV = false;
        return;
    }
    if (space_name === "management"){
        if(subpathInManagementNoAction.includes(subpath)) {
            canCreate = checkAccess("create", space_name, subpath, subpath.slice(1));
        }
    }
    canCreate = checkAccess("create", space_name, subpath, "content") || checkAccess("create", space_name, subpath, "folder");
});

let isOpen = $state(false);
</script>

<div class="flex flex-col md:flex-row justify-between items-center my-2 mx-3">
    <div>
        <Input placeholder="Search..."/>
    </div>
    <div>
        {#if canCreate}
            <Button class="bg-primary cursor-pointer" size="xs" onclick={() => isOpen = true}>
                <FileCirclePlusOutline size="md"/> Create
            </Button>
        {/if}
        {#if canUploadCSV}
            <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline>
                <UploadOutline size="md"/> Upload
            </Button>
        {/if}
        <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline>
            <DownloadOutline size="md"/> Download
        </Button>
        {#if canDelete}
            <Button class="text-red-600 cursor-pointer hover:text-red-600" size="xs" outline>
                <TrashBinOutline size="md"/> Delete
            </Button>
        {/if}

    </div>
</div>

<ModalCreateEntry {space_name} {subpath} bind:isOpen={isOpen} />
