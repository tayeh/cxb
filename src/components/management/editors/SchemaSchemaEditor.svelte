
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Button, Card, Checkbox, Input, Label, Select, Textarea, } from "flowbite-svelte";
    import { TrashBinOutline, PlusOutline } from "flowbite-svelte-icons";

    const dispatch = createEventDispatcher();

    let {
        content = $bindable({})
    } : {
        content: any
    } = $props();

    // Initialize schema structure
    if (!content || Object.keys(content).length === 0) {
        content = {
            type: "object",
            properties: {},
            required: []
        };
    }

    // Ensure required properties exist
    if (!content.properties) content.properties = {};
    if (!content.required) content.required = [];

    let errors = $state({});

    const fieldTypes = [
        { value: "string", name: "Text" },
        { value: "number", name: "Number" },
        { value: "integer", name: "Integer" },
        { value: "boolean", name: "Boolean" },
        { value: "array", name: "Array" },
        { value: "object", name: "Object" }
    ];

    const stringFormats = [
        { value: "", name: "No format" },
        { value: "email", name: "Email" },
        { value: "uri", name: "URL" },
        { value: "date", name: "Date" },
        { value: "date-time", name: "Date Time" },
        { value: "uuid", name: "UUID" }
    ];

    function validateForm() {
        errors = {};

        if (!content.properties || Object.keys(content.properties).length === 0) {
            errors['properties'] = 'At least one property is required';
        }

        return Object.keys(errors).length === 0;
    }

    function onSave() {
        if (validateForm()) {
            dispatch('save', content);
        }
    }

    function addProperty() {
        const newKey = `property_${Object.keys(content.properties).length + 1}`;
        content.properties[newKey] = {
            type: "string",
            title: "",
            description: ""
        };
        content = {...content};
    }

    function removeProperty(key: string) {
        delete content.properties[key];
        content.required = content.required.filter(req => req !== key);
        content = {...content};
    }

    function updatePropertyKey(oldKey: string, newKey: string) {
        if (oldKey === newKey || !newKey.trim()) return;

        const property = content.properties[oldKey];
        delete content.properties[oldKey];
        content.properties[newKey] = property;

        // Update required array
        const requiredIndex = content.required.indexOf(oldKey);
        if (requiredIndex !== -1) {
            content.required[requiredIndex] = newKey;
        }

        content = {...content};
    }

    function toggleRequired(key: string) {
        const index = content.required.indexOf(key);
        if (index === -1) {
            content.required.push(key);
        } else {
            content.required.splice(index, 1);
        }
        content = {...content};
    }

    function addArrayItem(propertyKey: string) {
        if (!content.properties[propertyKey].items) {
            content.properties[propertyKey].items = { type: "string" };
        }
        content = {...content};
    }

    function addObjectProperty(propertyKey: string) {
        if (!content.properties[propertyKey].properties) {
            content.properties[propertyKey].properties = {};
        }
        if (!content.properties[propertyKey].required) {
            content.properties[propertyKey].required = [];
        }

        const newKey = `nested_${Object.keys(content.properties[propertyKey].properties).length + 1}`;
        content.properties[propertyKey].properties[newKey] = {
            type: "string",
            title: "",
            description: ""
        };
        content = {...content};
    }

    function removeObjectProperty(parentKey: string, childKey: string) {
        delete content.properties[parentKey].properties[childKey];
        if (content.properties[parentKey].required) {
            content.properties[parentKey].required = content.properties[parentKey].required.filter(req => req !== childKey);
        }
        content = {...content};
    }

    function toggleObjectRequired(parentKey: string, childKey: string) {
        if (!content.properties[parentKey].required) {
            content.properties[parentKey].required = [];
        }

        const index = content.properties[parentKey].required.indexOf(childKey);
        if (index === -1) {
            content.properties[parentKey].required.push(childKey);
        } else {
            content.properties[parentKey].required.splice(index, 1);
        }
        content = {...content};
    }
</script>

<Card class="p-4 max-w-6xl mx-auto">
    <h2 class="text-xl font-bold mb-4">JSON Schema Editor</h2>

    <div class="space-y-6">
        <!-- Schema Metadata -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label for="schema_title">Schema Title</Label>
                <Input id="schema_title" placeholder="Enter schema title" bind:value={content.title} />
            </div>
            <div>
                <Label for="schema_description">Schema Description</Label>
                <Textarea id="schema_description" placeholder="Enter schema description" bind:value={content.description} />
            </div>
        </div>

        <!-- Properties Section -->
        <div class="border p-4 rounded-lg">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold">Properties</h3>
                <Button size="sm" onclick={addProperty}>
                    <PlusOutline class="w-4 h-4 mr-2" />
                    Add Property
                </Button>
            </div>

            {#if errors['properties']}
                <p class="text-red-500 text-sm mb-2">{errors['properties']}</p>
            {/if}

            {#if Object.keys(content.properties).length > 0}
                {#each Object.entries(content.properties) as [key, property], index}
                    <div class="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <!-- Property Key -->
                            <div>
                                <Label>Property Key</Label>
                                <Input
                                        value={key}
                                        onblur={(e) => updatePropertyKey(key, e.target.value)}
                                        placeholder="Property key"
                                />
                            </div>

                            <!-- Property Type -->
                            <div>
                                <Label>Type</Label>
                                <Select bind:value={property.type} items={fieldTypes} />
                            </div>

                            <!-- Required Checkbox -->
                            <div class="flex items-center space-x-2">
                                <Checkbox
                                        checked={content.required.includes(key)}
                                        onchange={() => toggleRequired(key)}
                                />
                                <Label>Required</Label>
                                <Button size="xs" color="red" onclick={() => removeProperty(key)}>
                                    <TrashBinOutline class="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <!-- Property Details -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <Label>Title</Label>
                                <Input bind:value={property.title} placeholder="Display title" />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input bind:value={property.description} placeholder="Field description" />
                            </div>
                        </div>

                        <!-- Type-specific configurations -->
                        {#if property.type === "string"}
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Format</Label>
                                    <Select bind:value={property.format} items={stringFormats} />
                                </div>
                                <div>
                                    <Label>Min Length</Label>
                                    <NumberInput bind:value={property.minLength} placeholder="0" />
                                </div>
                                <div>
                                    <Label>Max Length</Label>
                                    <NumberInput bind:value={property.maxLength} placeholder="100" />
                                </div>
                            </div>
                            <div class="mt-2">
                                <Label>Pattern (RegEx)</Label>
                                <Input bind:value={property.pattern} placeholder="Regular expression pattern" />
                            </div>
                        {/if}

                        {#if property.type === "number" || property.type === "integer"}
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Minimum</Label>
                                    <NumberInput bind:value={property.minimum} placeholder="Min value" />
                                </div>
                                <div>
                                    <Label>Maximum</Label>
                                    <NumberInput bind:value={property.maximum} placeholder="Max value" />
                                </div>
                            </div>
                        {/if}

                        {#if property.type === "array"}
                            <div class="border border-gray-300 rounded p-3 mt-2">
                                <div class="flex justify-between items-center mb-2">
                                    <Label class="font-medium">Array Items</Label>
                                    <Button size="xs" onclick={() => addArrayItem(key)}>Configure Items</Button>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Item Type</Label>
                                        <Select bind:value={property.items.type} items={fieldTypes} />
                                    </div>
                                    <div>
                                        <Label>Min Items</Label>
                                        <NumberInput bind:value={property.minItems} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label>Max Items</Label>
                                        <NumberInput bind:value={property.maxItems} placeholder="10" />
                                    </div>
                                </div>

                                <div class="mt-2">
                                    <Checkbox bind:checked={property.uniqueItems} />
                                    <Label class="ml-2">Unique Items</Label>
                                </div>
                            </div>
                        {/if}

                        {#if property.type === "object"}
                            <div class="border border-gray-300 rounded p-3 mt-2">
                                <div class="flex justify-between items-center mb-2">
                                    <Label class="font-medium">Object Properties</Label>
                                    <Button size="xs" onclick={() => addObjectProperty(key)}>
                                        <PlusOutline class="w-3 h-3 mr-1" />
                                        Add Property
                                    </Button>
                                </div>

                                {#if property.properties && Object.keys(property.properties).length > 0}
                                    {#each Object.entries(property.properties) as [childKey, childProperty]}
                                        <div class="border border-gray-200 rounded p-2 mb-2 bg-white">
                                            <div class="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                                <Input
                                                        value={childKey}
                                                        placeholder="Property key"
                                                        size="sm"
                                                />
                                                <Select bind:value={childProperty.type} items={fieldTypes} size="sm" />
                                                <Input bind:value={childProperty.title} placeholder="Title" size="sm" />
                                                <div class="flex items-center space-x-2">
                                                    <Checkbox
                                                            checked={property.required?.includes(childKey)}
                                                            onchange={() => toggleObjectRequired(key, childKey)}
                                                    />
                                                    <Label class="text-sm">Required</Label>
                                                    <Button size="xs" color="red" onclick={() => removeObjectProperty(key, childKey)}>
                                                        <TrashBinOutline class="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        {/if}

                        <!-- Default Value -->
                        <div class="mt-2">
                            <Label>Default Value</Label>
                            {#if property.type === "boolean"}
                                <Checkbox bind:checked={property.default} />
                            {:else if property.type === "number" || property.type === "integer"}
                                <Input type="number" bind:value={property.default} placeholder="Default value" />
                            {:else}
                                <Input bind:value={property.default} placeholder="Default value" />
                            {/if}
                        </div>
                    </div>
                {/each}
            {:else}
                <p class="text-gray-500 text-center py-8">No properties defined. Click "Add Property" to start building your schema.</p>
            {/if}
        </div>

        <!-- Schema Options -->
        <div class="border p-4 rounded-lg">
            <h3 class="font-semibold mb-4">Schema Options</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Checkbox bind:checked={content.additionalProperties} />
                    <Label class="ml-2">Allow Additional Properties</Label>
                </div>
            </div>
        </div>

        <!-- JSON Preview -->
        <div class="border p-4 rounded-lg">
            <h3 class="font-semibold mb-2">JSON Schema Preview</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">{JSON.stringify(content, null, 2)}</pre>
        </div>
    </div>
</Card>