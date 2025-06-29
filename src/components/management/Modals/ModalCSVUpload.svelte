<script lang="ts">
    import {Button, Label, Modal, Select, Spinner} from "flowbite-svelte";
    import {Dmart, QueryType, ResourceType} from "@edraj/tsdmart";
    import {Level, showToast} from "@/utils/toast";
    import {currentListView} from "@/stores/global";

    let {
        space_name,
        subpath,
        isOpen=$bindable(false),
    }:{
        space_name:string,
        subpath:string
        isOpen:boolean,
    } = $props();

    let selectedResourceType = $state(ResourceType.content);
    let selectedSchema = $state(null);
    let payloadFiles = $state([]);
    let isUploading = $state(false);
    let resourceTypeError = $state(false);
    let schemaError = $state(false);

    function parseQuerySchemaResponse(schemas){
        if (schemas === null) {
            return [];
        }
        let result = [];
        const _schemas = schemas.records.map((e) => e.shortname);
        result = _schemas.filter(
            (e: any) => !["meta_schema", "folder_rendering"].includes(e)
        );

        let r = result.map((e: any) => ({
            name: e,
            value: e
        }));
        return r;
    }

    function handleFileChange(e) {
        const files = e.target.files;
        if (files.length > 0) {
            payloadFiles = Array.from(files);
        }
    }

    async function handleCSVUpload() {
        resourceTypeError = false;
        schemaError = false;

        let hasError = false;

        if (!selectedResourceType) {
            showToast(Level.warn, "Please select a resource type");
            resourceTypeError = true;
            hasError = true;
        }

        if (!selectedSchema) {
            showToast(Level.warn, "Please select a schema");
            schemaError = true;
            hasError = true;
        }

        if (!payloadFiles.length) {
            showToast(Level.warn, "Please select a CSV file");
            hasError = true;
        }

        if (hasError) {
            return;
        }

        try {
            isUploading = true;
            const response = await Dmart.resources_from_csv(
                space_name,
                subpath,
                selectedResourceType,
                selectedSchema,
                payloadFiles[0]
            );

            if (response.status === "success") {
                showToast(Level.info, "CSV uploaded successfully");
                await $currentListView.fetchPageRecords();
                isOpen = false;
            } else {
                showToast(Level.warn, "Failed to upload CSV");
            }
        } catch (error) {
            showToast(Level.warn, "Error uploading CSV");
        } finally {
            isUploading = false;
        }
    }
</script>

<Modal
    bodyClass="h-auto justify-center"
    bind:open={isOpen}
    size="md"
>
    {#snippet header()}
        <h3>Upload CSV</h3>
    {/snippet}
    <div>
        <Label>
            Resource Type
            <Select 
                class="my-2 {resourceTypeError ? 'border-red-500' : ''}" 
                items={[
                    { name: ResourceType.content.toString(), value: ResourceType.content },
                    { name: ResourceType.folder.toString(), value: ResourceType.folder },
                    { name: ResourceType.ticket.toString(), value: ResourceType.ticket }
                ]} 
                bind:value={selectedResourceType} 
                onchange={() => resourceTypeError = false}
            />
            {#if resourceTypeError}
                <p class="text-red-500 text-xs mt-1">Resource type is required</p>
            {/if}
        </Label>

        <Label class="mt-3">
            Schema
            {#await Dmart.query({
                space_name,
                type: QueryType.search,
                subpath: "/schema",
                search: "",
                retrieve_json_payload: true,
                limit: 100
            })}
                <div role="status" class="max-w-sm animate-pulse">
                    <div class="h-3 bg-gray-200 rounded-full dark:bg-gray-700 mx-2 my-2.5"></div>
                </div>
            {:then schemas}
                <Select 
                    class="mt-2 {schemaError ? 'border-red-500' : ''}" 
                    items={parseQuerySchemaResponse(schemas)} 
                    bind:value={selectedSchema} 
                    onchange={() => schemaError = false}
                />
                {#if schemaError}
                    <p class="text-red-500 text-xs mt-1">Schema is required</p>
                {/if}
            {/await}
        </Label>

        <Label class="mt-3">
            CSV File
            <input type="file" accept=".csv" onchange={handleFileChange} class="mt-2 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
        </Label>
    </div>

    {#snippet footer()}
        <Button color="alternative" onclick={() => isOpen = false}>Cancel</Button>
        <Button class="bg-primary" onclick={handleCSVUpload} disabled={isUploading}>
            {#if isUploading}
                <Spinner size="sm" class="mr-2" />
                Uploading...
            {:else}
                Upload
            {/if}
        </Button>
    {/snippet}
</Modal>
