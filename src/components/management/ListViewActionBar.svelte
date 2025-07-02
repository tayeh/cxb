<script lang="ts">
import {FileCirclePlusOutline,UploadOutline, DownloadOutline,TrashBinOutline,SearchOutline} from "flowbite-svelte-icons";
import {Button, Input,ButtonGroup,InputAddon} from "flowbite-svelte";
import ModalCreateEntry from "@/components/management/Modals/ModalCreateEntry.svelte";
import ModalCSVUpload from "@/components/management/Modals/ModalCSVUpload.svelte";
import ModalCSVDownload from "@/components/management/Modals/ModalCSVDownload.svelte";
import {onMount} from "svelte";
import {checkAccess} from "@/utils/checkAccess";
import {currentEntry, currentListView, subpathInManagementNoAction} from "@/stores/global";
import {bulkBucket} from "@/stores/management/bulk_bucket";
import {Dmart,RequestType} from "@edraj/tsdmart";
import {Level, showToast} from "@/utils/toast";
import {searchListView} from "@/stores/management/triggers";

let {space_name,subpath}:{space_name:string,subpath:string} = $props();

let canCreate = $state(false);
let canUploadCSV = $state(false);
let canDownloadCSV = $state(false);
let canDelete = $state(false);
let isCSVDownloadModalOpen = $state(false);

onMount(() => {
    if($currentEntry.entry?.payload?.body?.allow_csv){
        canDownloadCSV = true
    }
    if($currentEntry.entry?.payload?.body?.allow_upload_csv){
        canUploadCSV = true
    }

    if(space_name === "management" && subpath === "/") {
        canCreate = false;
        canDelete = false;
        canUploadCSV = false;
        return;
    } else if (space_name === "management" && subpath === "health_check"){
        canCreate = false;
        canUploadCSV = false;
        return;
    }
    if (space_name === "management"){
        if(subpathInManagementNoAction.includes(subpath)) {
            canCreate = checkAccess("create", space_name, subpath, subpath.slice(0,-1));
        } else {
            canCreate = checkAccess("create", space_name, subpath, "content");
        }
    } else {
        canCreate = checkAccess("create", space_name, subpath, "content") || checkAccess("create", space_name, subpath, "folder");
    }

});

let isOpen = $state(false);

async function handleBulkDelete() {
    if ($bulkBucket.length) {
        if (
            confirm(`Are you sure want to delete (${$bulkBucket.map(e => e.shortname).join(", ")}) ${$bulkBucket.length === 1 ? "entry" : "entries"} ?`) ===
            false
        ) {
            return;
        }

        const records = []
        $bulkBucket.map(b => {
            records.push({
                resource_type: b.resource_type,
                shortname: b.shortname,
                subpath: subpath || "/",
                attributes: {},
            });
        });

        const request_body = {
            space_name,
            request_type: RequestType.delete,
            records: records,
        };
        const response = await Dmart.request(request_body);

        if (response?.status === "success") {
            showToast(Level.info);
        } else {
            showToast(Level.warn);
        }
        await $currentListView.fetchPageRecords();
        bulkBucket.set([]);
    }
}

let searchInput = "";
async function handleSearch(e){
    searchListView.set(searchInput);
    await $currentListView.fetchPageRecords()
}


let isCSVUploadModalOpen = $state(false);
function handleCSVUploadModal() {
    isCSVUploadModalOpen = true;
}
</script>

<div class="flex flex-col md:flex-row justify-between items-center my-2 mx-3">
    <div class="w-1/2">
        <form on:submit|preventDefault={handleSearch}>
            <ButtonGroup class="w-full">
                <Input id="website-admin" placeholder="Search..." bind:value={searchInput} />
                <InputAddon class="cursor-pointer" onclick={handleSearch}>
                    <SearchOutline class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </InputAddon>
            </ButtonGroup>
        </form>
    </div>
    <div>
        {#if canCreate}
            <Button class="bg-primary cursor-pointer" size="xs" onclick={() => isOpen = true}>
                <FileCirclePlusOutline size="md"/> Create
            </Button>
        {/if}
        {#if canUploadCSV}
            <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline
                    onclick={handleCSVUploadModal}>
                <UploadOutline size="md"/> Upload
            </Button>
        {/if}
        {#if canDownloadCSV}
            <Button class="text-primary cursor-pointer hover:text-primary" size="xs" outline
                    onclick={() => isCSVDownloadModalOpen = true}>
                <DownloadOutline size="md"/> Download
            </Button>
        {/if}
        {#if canDelete}
            <Button class="text-red-600 cursor-pointer hover:text-red-600" size="xs" outline>
                <TrashBinOutline size="md"/> Delete
            </Button>
        {/if}
        {#if $bulkBucket.length}
            <Button class="text-red-600 cursor-pointer hover:text-red-600" size="xs" outline onclick={handleBulkDelete}>
                <TrashBinOutline size="md"/> Bulk delete
            </Button>
        {/if}

    </div>
</div>

{#if canCreate}
    <ModalCreateEntry {space_name} {subpath} bind:isOpen={isOpen} />
{/if}

{#if canUploadCSV}
    <ModalCSVUpload {space_name} {subpath} bind:isOpen={isCSVUploadModalOpen} />
{/if}

{#if canDownloadCSV}
    <ModalCSVDownload
        {space_name}
        {subpath}
        bind:isOpen={isCSVDownloadModalOpen}
    />
{/if}