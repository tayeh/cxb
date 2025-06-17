<script lang="ts">
    import { Button, Label, Modal, Input, Select, Fileupload, Textarea } from "flowbite-svelte";
    import { Dmart, QueryType, ResourceAttachmentType, ContentType } from "@edraj/tsdmart";
    import {JSONEditor, Mode} from "svelte-jsoneditor";
    import HtmlEditor from "@/components/management/editors/HtmlEditor.svelte";
    import MarkdownEditor from "@/components/management/editors/MarkdownEditor.svelte";

    // Props
    let {
        meta = $bindable({}),
        payload = $bindable({}),
        isOpen = $bindable(false),
        isUpdateMode = $bindable(false),
        space_name = $bindable(""),
    } = $props();

    // State variables
    let shortname = $state("");
    let displayname = $state({ en: "", ar: "", ku: "" });
    let description = $state({ en: "", ar: "", ku: "" });
    let resourceType = $state(ResourceAttachmentType.media);
    let contentType = $state(ContentType.image);
    let payloadFiles = $state<FileList | null>(null);
    let payloadData = $state("");
    let payloadContent: any = $state();
    let selectedSchema = $state("");

    // Methods
    function toggleModal() {
        isOpen = !isOpen;
    }

    function upload() {
        // Implement your upload logic here
        console.log("Upload called");
        isOpen = false;
    }

    function handleRenderMenu(menuItems) {
        return menuItems;
    }

    function setSchemaItems(schemas) {
        return schemas?.records?.map(e => e.shortname) || [];
    }
</script>

<Modal
    bind:open={isOpen}
    size="xl"
>
    <div class="flex justify-between items-center px-4 pt-4 border-b rounded-t">
        <h3 class="text-xl font-semibold text-gray-900">
            {isUpdateMode ? "Update attachment" : "Add attachment"}
        </h3>
    </div>

    <div class="p-4 max-h-[75vh] overflow-y-auto">
        <div class="flex flex-col space-y-4">
            <div>
                <Label for="shortname">Attachment shortname</Label>
                <Input
                        id="shortname"
                        bind:value={shortname}
                        disabled={isUpdateMode}
                />
            </div>

            <div class="space-y-2">
                <Label>Displayname</Label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Input
                                type="text"
                                bind:value={displayname.en}
                                placeholder="English..."
                        />
                    </div>
                    <div>
                        <Input
                                type="text"
                                bind:value={displayname.ar}
                                placeholder="Arabic..."
                        />
                    </div>
                    <div>
                        <Input
                                type="text"
                                bind:value={displayname.ku}
                                placeholder="Kurdish..."
                        />
                    </div>
                </div>
            </div>

            <div class="space-y-2">
                <Label>Description</Label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Input
                                type="text"
                                bind:value={description.en}
                                placeholder="English..."
                        />
                    </div>
                    <div>
                        <Input
                                type="text"
                                bind:value={description.ar}
                                placeholder="Arabic..."
                        />
                    </div>
                    <div>
                        <Input
                                type="text"
                                bind:value={description.ku}
                                placeholder="Kurdish..."
                        />
                    </div>
                </div>
            </div>

            <div>
                <Label for="resourceType">Attachment Type</Label>
                <Select
                        id="resourceType"
                        bind:value={resourceType}
                        disabled={isUpdateMode}
                >
                    {#each Object.values(ResourceAttachmentType).filter(type => type !== ResourceAttachmentType.alteration) as type}
                        <option value={type}>{type}</option>
                    {/each}
                </Select>
            </div>

            {#if resourceType === ResourceAttachmentType.media}
                <div>
                    <Label for="contentType">Content Type</Label>
                    <Select
                            id="contentType"
                            bind:value={contentType}
                            disabled={isUpdateMode}
                    >
                        {#each Object.values(ContentType) as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </Select>
                </div>

                <hr class="my-4" />

                {#if contentType === ContentType.image}
                    <div>
                        <Label for="imageFile">Image File</Label>
                        <Fileupload
                                id="imageFile"
                                type="file"
                                accept="image/png, image/jpeg"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if contentType === ContentType.pdf}
                    <div>
                        <Label for="pdfFile">PDF File</Label>
                        <Fileupload
                                id="pdfFile"
                                type="file"
                                accept="application/pdf"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if contentType === ContentType.audio}
                    <div>
                        <Label for="audioFile">Audio File</Label>
                        <Fileupload
                                id="audioFile"
                                type="file"
                                accept="audio/*"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if contentType === ContentType.python}
                    <div>
                        <Label for="pythonFile">Python File</Label>
                        <Fileupload
                                id="pythonFile"
                                type="file"
                                accept=".py"
                                clearable
                                bind:files={payloadFiles}
                        />
                    </div>
                {:else if contentType === ContentType.markdown}
                    <div>
                        <MarkdownEditor bind:content={payloadData} />
                    </div>
                {:else if contentType === ContentType.html}
                    <div>
                        <HtmlEditor bind:content={payloadData} />
                    </div>
                {:else}
                    <div>
                        <Textarea bind:value={payloadData} />
                    </div>
                {/if}
            {:else if resourceType === ResourceAttachmentType.json}
                <div>
                    <JSONEditor
                    onRenderMenu={handleRenderMenu}
                    mode={Mode.text}
                    bind:content={payloadContent}
                    />
                </div>
            {:else if resourceType === ResourceAttachmentType.comment}
                <div>
                    <Textarea bind:value={payloadData} />
                </div>
            {:else if resourceType === ResourceAttachmentType.csv}
                <div>
                    <Label for="csvFile">CSV File</Label>
                    <Fileupload
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            clearable
                            bind:files={payloadFiles}
                    />

                    <div class="mt-3">
                        <Label for="csvSchema">Schema</Label>
                        <Select
                                id="csvSchema"
                                bind:value={selectedSchema}
                                disabled={isUpdateMode}
                        >
                            <option value="">None</option>
                            {#await Dmart.query({ space_name, type: QueryType.search, subpath: "/schema", search: "", retrieve_json_payload: true, limit: 99 }) then schemas}
                                {#each schemas.records.map(e => e.shortname) as schema}
                                    <option value={schema}>{schema}</option>
                                {/each}
                            {/await}
                        </Select>
                    </div>
                </div>
            {:else if resourceType === ResourceAttachmentType.jsonl}
                <div>
                    <Label for="jsonlFile">JSONL File</Label>
                    <Fileupload
                            id="jsonlFile"
                            type="file"
                            accept=".jsonl"
                            clearable
                            bind:files={payloadFiles}
                    />
                </div>
            {:else if resourceType === ResourceAttachmentType.sqlite}
                <div>
                    <Label for="sqliteFile">SQLite File</Label>
                    <Fileupload
                            id="sqliteFile"
                            type="file"
                            accept=".sqlite,.sqlite3,.db,.db3,.s3db,.sl3"
                            clearable
                            bind:files={payloadFiles}
                    />
                </div>
            {:else if resourceType === ResourceAttachmentType.parquet}
                <div>
                    <Label for="parquetFile">Parquet File</Label>
                    <Fileupload
                            id="parquetFile"
                            type="file"
                            accept=".parquet"
                            clearable
                            bind:files={payloadFiles}
                    />
                </div>
            {/if}
        </div>
    </div>

    <div class="flex justify-end space-x-2 p-4 border-t">
        <Button color="alternative" onclick={toggleModal}>
            Close
        </Button>
        <Button color="blue" onclick={upload}>
            Upload
        </Button>
    </div>
</Modal>