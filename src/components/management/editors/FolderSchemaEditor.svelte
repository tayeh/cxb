<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Button, Card, Checkbox, Input, Label, Select, Textarea } from "flowbite-svelte";

    const dispatch = createEventDispatcher();

    let {
        content = $bindable({})
    } : {
        content: any
    } = $props();

    if (!content || Object.keys(content).length === 0) {
        content = {
            index_attributes: []
        };
    }

    if (!content.query) content.query = {};

    let errors = $state({});

    function validateForm() {
        errors = {};

        if (!content.index_attributes || content.index_attributes.length === 0) {
            errors['index_attributes'] = 'Index attributes is required';
        }

        return Object.keys(errors).length === 0;
    }

    function onSave() {
        if (validateForm()) {
            dispatch('save', content);
        }
    }

    function addItem(path, template = {}) {
        let target = content;
        const parts = path.split('.');

        for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) target[parts[i]] = {};
            target = target[parts[i]];
        }

        const lastPart = parts[parts.length - 1];
        if (!target[lastPart]) target[lastPart] = [];

        target[lastPart] = [...target[lastPart], structuredClone(template)];
        content = {...content};
    }

    function removeItem(path, index) {
        let target = content;
        const parts = path.split('.');

        for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) return;
            target = target[parts[i]];
        }

        const lastPart = parts[parts.length - 1];
        if (!target[lastPart]) return;

        target[lastPart] = target[lastPart].filter((_, i) => i !== index);
        content = {...content};
    }
</script>

<Card class="p-4 max-w-4xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Folder Schema Editor</h2>

    <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label for="icon">Folder Main Icon</Label>
                <Input id="icon" placeholder="Enter icon name" bind:value={content.icon} />
                <p class="text-sm text-gray-500">The icon displayed next to the folder</p>
            </div>

            <div>
                <Label for="icon_closed">Folder Closed Icon</Label>
                <Input id="icon_closed" placeholder="Enter closed icon name" bind:value={content.icon_closed} />
                <p class="text-sm text-gray-500">Icon when folder is closed</p>
            </div>

            <div>
                <Label for="icon_opened">Folder Opened Icon</Label>
                <Input id="icon_opened" placeholder="Enter opened icon name" bind:value={content.icon_opened} />
                <p class="text-sm text-gray-500">Icon when folder is opened</p>
            </div>

            <div>
                <Label for="shortname_title">Shortname Field Title</Label>
                <Input id="shortname_title" placeholder="Shortname field title" bind:value={content.shortname_title} />
            </div>
        </div>

        <div class="border p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Query Settings</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label for="query_type">Query Type</Label>
                    <Select id="query_type" bind:value={content.query.type}>
                        <option value="">Select type</option>
                        <option value="subpath">Subpath</option>
                        <option value="search">Search</option>
                    </Select>
                </div>

                <div>
                    <Label for="query_search">Search Query</Label>
                    <Input id="query_search" placeholder="Enter search query" bind:value={content.query.search} />
                </div>
            </div>

            <div class="mt-3">
                <Label>Filter Types</Label>
                {#if content.query.filter_types?.length > 0}
                    {#each content.query.filter_types as filterType, index}
                        <div class="flex items-center gap-2 mt-1">
                            <Input bind:value={content.query.filter_types[index]} placeholder="Filter type" />
                            <Button size="xs" color="red" onclick={() => removeItem('query.filter_types', index)}>Remove</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('query.filter_types', '')}>Add Filter Type</Button>
            </div>
        </div>

        <div class="border p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Index Attributes</h3>
            <p class="text-sm text-gray-500 mb-2">The attributes from the schema that should be displayed in index page</p>

            {#if errors['index_attributes']}
                <p class="text-red-500 text-sm">{errors['index_attributes']}</p>
            {/if}

            {#if content.index_attributes?.length > 0}
                {#each content.index_attributes as attribute, index}
                    <div class="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded">
                        <div class="flex-1">
                            <Input bind:value={attribute.key} placeholder="Key" />
                        </div>
                        <div class="flex-1">
                            <Input bind:value={attribute.name} placeholder="Name" />
                        </div>
                        <Button size="xs" color="red" onclick={() => removeItem('index_attributes', index)}>Remove</Button>
                    </div>
                {/each}
            {/if}
            <Button size="sm" class="mt-2 text-gray" outline onclick={() => addItem('index_attributes', {key: '', name: ''})}>Add Index Attribute</Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border p-4 rounded-lg">
                <h3 class="font-semibold mb-2">Search Columns</h3>

                {#if content.search_columns?.length > 0}
                    {#each content.search_columns as column, index}
                        <div class="flex items-center gap-2 mt-2">
                            <div class="flex-1">
                                <Input bind:value={column.key} placeholder="Key" size="sm" />
                            </div>
                            <div class="flex-1">
                                <Input bind:value={column.name} placeholder="Name" size="sm" />
                            </div>
                            <Button size="xs" color="red" onclick={() => removeItem('search_columns', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('search_columns', {key: '', name: ''})}>Add Column</Button>
            </div>

            <div class="border p-4 rounded-lg">
                <h3 class="font-semibold mb-2">CSV Columns</h3>

                {#if content.csv_columns?.length > 0}
                    {#each content.csv_columns as column, index}
                        <div class="flex items-center gap-2 mt-2">
                            <div class="flex-1">
                                <Input bind:value={column.key} placeholder="Key" size="sm" />
                            </div>
                            <div class="flex-1">
                                <Input bind:value={column.name} placeholder="Name" size="sm" />
                            </div>
                            <Button size="xs" color="red" onclick={() => removeItem('csv_columns', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('csv_columns', {key: '', name: ''})}>Add Column</Button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label for="sort_by">Sort By</Label>
                <Input id="sort_by" placeholder="Field name for sorting" bind:value={content.sort_by} />
            </div>

            <div>
                <Label for="sort_type">Sort Order</Label>
                <Select id="sort_type" bind:value={content.sort_type}>
                    <option value="">Select order</option>
                    <option value="ascending">Ascending</option>
                    <option value="descending">Descending</option>
                </Select>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border p-3 rounded-md">
                <h3 class="font-semibold mb-2">Content Resource Types</h3>

                {#if content.content_resource_types?.length > 0}
                    {#each content.content_resource_types as type, index}
                        <div class="flex items-center gap-2 mt-1">
                            <Input bind:value={content.content_resource_types[index]} placeholder="Resource type" />
                            <Button size="xs" color="red" onclick={() => removeItem('content_resource_types', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('content_resource_types', '')}>Add Resource Type</Button>
            </div>

            <div class="border p-3 rounded-md">
                <h3 class="font-semibold mb-2">Schema Shortnames</h3>

                {#if content.content_schema_shortnames?.length > 0}
                    {#each content.content_schema_shortnames as shortname, index}
                        <div class="flex items-center gap-2 mt-1">
                            <Input bind:value={content.content_schema_shortnames[index]} placeholder="Schema shortname" />
                            <Button size="xs" color="red" onclick={() => removeItem('content_schema_shortnames', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('content_schema_shortnames', '')}>Add Schema Shortname</Button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border p-3 rounded-md">
                <h3 class="font-semibold mb-2">Workflow Shortnames</h3>

                {#if content.workflow_shortnames?.length > 0}
                    {#each content.workflow_shortnames as shortname, index}
                        <div class="flex items-center gap-2 mt-1">
                            <Input bind:value={content.workflow_shortnames[index]} placeholder="Workflow shortname" />
                            <Button size="xs" color="red" onclick={() => removeItem('workflow_shortnames', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('workflow_shortnames', '')}>Add Workflow Shortname</Button>
            </div>

            <div class="border p-3 rounded-md">
                <h3 class="font-semibold mb-2">PDF Schema Shortnames</h3>

                {#if content.enable_pdf_schema_shortnames?.length > 0}
                    {#each content.enable_pdf_schema_shortnames as shortname, index}
                        <div class="flex items-center gap-2 mt-1">
                            <Input bind:value={content.enable_pdf_schema_shortnames[index]} placeholder="Schema shortname" />
                            <Button size="xs" color="red" onclick={() => removeItem('enable_pdf_schema_shortnames', index)}>×</Button>
                        </div>
                    {/each}
                {/if}
                <Button size="xs" class="mt-2 text-gray" outline onclick={() => addItem('enable_pdf_schema_shortnames', '')}>Add PDF Schema Shortname</Button>
            </div>
        </div>

        <div class="border p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Folder Options</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div class="flex items-center">
                    <Checkbox id="allow_view" bind:checked={content.allow_view} />
                    <Label for="allow_view" class="ml-2">Allow resource view</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_create" bind:checked={content.allow_create} />
                    <Label for="allow_create" class="ml-2">Allow resource creation</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_update" bind:checked={content.allow_update} />
                    <Label for="allow_update" class="ml-2">Allow resource update</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_delete" bind:checked={content.allow_delete} />
                    <Label for="allow_delete" class="ml-2">Allow resource delete</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_create_category" bind:checked={content.allow_create_category} />
                    <Label for="allow_create_category" class="ml-2">Allow folder creation</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_csv" bind:checked={content.allow_csv} />
                    <Label for="allow_csv" class="ml-2">Allow CSV download</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="allow_upload_csv" bind:checked={content.allow_upload_csv} />
                    <Label for="allow_upload_csv" class="ml-2">Allow CSV upload</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="use_media" bind:checked={content.use_media} />
                    <Label for="use_media" class="ml-2">Content has media</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="stream" bind:checked={content.stream} />
                    <Label for="stream" class="ml-2">Enable websocket stream</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="expand_children" bind:checked={content.expand_children} />
                    <Label for="expand_children" class="ml-2">Expand children</Label>
                </div>

                <div class="flex items-center">
                    <Checkbox id="disable_filter" bind:checked={content.disable_filter} />
                    <Label for="disable_filter" class="ml-2">Disable filter</Label>
                </div>
            </div>
        </div>
    </div>
</Card>