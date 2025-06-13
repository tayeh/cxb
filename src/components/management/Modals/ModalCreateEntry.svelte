<script lang="ts">
    import {Button, Label, Modal, Select} from "flowbite-svelte";
    import {Dmart, QueryType, ResourceType} from "@edraj/tsdmart";
    import FolderSchemaEditor from "@/components/management/editors/FolderSchemaEditor.svelte";
    import {untrack} from "svelte";
    import {generateObjectFromSchema} from "@/utils/renderer/rendererUtils";
    import Prism from "@/components/Prism.svelte";

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
    let allowedResourceTypes = $state([
        {
            name: ResourceType.folder.toString(),
            value: ResourceType.folder,
        },
        {
            name: ResourceType.content.toString(),
            value: ResourceType.content,
        }
    ]);


    let selectedSchema = $state(null);
    function parseQuerySchemaResponse(schemas){
        if (schemas === null) {
            return [{
                name: "None",
                value: null
            }];
        }
        let result = [];
        const _schemas = schemas.records.map((e) => e.shortname);
        if (selectedResourceType === ResourceType.folder) {
            result = ["folder_rendering", ..._schemas];
        } else {
            result = _schemas.filter(
                (e: any) => !["meta_schema", "folder_rendering"].includes(e)
            );
        }
        const r = result.map((e: any) => ({
            name: e,
            value: e
        }));
        r.unshift({
            name: "None",
            value: null
        });
        return r;
    }

    let content = $state({
        json: {}
    });
    let errorContent = $state(null);
    function handleSave() {}
    function handleCreateEntry() {}

    let isFolderFormReady = $state(false);
    async function setFolderSchemaContent(){
        try {
            isFolderFormReady = false;
            const _schemaContent = await Dmart.retrieve_entry(
                ResourceType.schema,
                "management",
                "schema",
                "folder_rendering",
                true
            );
            content = {
                json: _schemaContent && generateObjectFromSchema(_schemaContent.payload.body)
            }
            isFolderFormReady = true;
        } catch (e) {
            errorContent = e.response.data;
            isFolderFormReady = false;
        }
    }

    $effect(()=>{
        if(selectedResourceType === ResourceType.folder){
            untrack(()=>{
                setFolderSchemaContent();
            });
        }
    });
</script>

<Modal
    bodyClass="h-s75vh justify-center"
    bind:open={isOpen}
    size="lg"
>
    {#snippet header()}
        <h3>Create New Entry</h3>
    {/snippet}
    <div>
        <Label>
            Resource Type
            <Select class="my-2" items={allowedResourceTypes} bind:value={selectedResourceType} />
        </Label>

        {#if !["workflows", "schema"].includes(subpath) && ![ResourceType.folder, ResourceType.role, ResourceType.permission].includes(selectedResourceType)}
            <Label class="mt-3">
                Schema
                {#await Dmart.query({
                    space_name,
                    type: QueryType.search,
                    subpath: "/schema",
                    search: "",
                    retrieve_json_payload: true,
                    limit: 99
                }) then schemas}
                    <Select class="mt-2" items={parseQuerySchemaResponse(schemas)} bind:value={selectedSchema} />
                {/await}
            </Label>
        {/if}
        {#if isFolderFormReady}
            <FolderSchemaEditor bind:content={content.json} />
        {/if}

        {#if errorContent}
            <div class="mt-3">
                <Prism code={errorContent} language={"json"} />
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <div class="w-full flex flex-row justify-end">
            <Button class="text-primary mx-1" outline onclick={() => isOpen = false}>
                Close
            </Button>
            <Button class="bg-primary mx-1" onclick={handleCreateEntry}>Create</Button>
        </div>
    {/snippet}

</Modal>