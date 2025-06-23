<script lang="ts">
    import {
        Card,
        Label,
        Input,
        Checkbox,
        Button,
        Textarea,
        Accordion,
        AccordionItem,
        Select
    } from 'flowbite-svelte';
    import {onMount} from "svelte";

    let {
        formData = $bindable(),
        validateFn = $bindable()
    } = $props();


    formData = {
        ...formData,
        shortname: formData.shortname || null,
        is_active: formData.is_active || true,
        slug: formData.slug || null,
        displayname: {
            en: formData.displayname?.en || null,
            ar: formData.displayname?.ar || null,
            ku: formData.displayname?.ku || null
        },
        description: {
            en: formData.description?.en || null,
            ar: formData.description?.ar || null,
            ku: formData.description?.ku || null
        },
    }

    let form;
    $effect(() => {
        validateFn = validate;
    });
    function validate() {
        const isValid = form.checkValidity();

        if (!isValid) {
            form.reportValidity();
        }

        return isValid;
    }
</script>

<Card class="w-full max-w-4xl mx-auto p-4 my-2">
    <form bind:this={form} class="space-y-4">
        <h2 class="text-2xl font-bold mb-4">Meta Information</h2>
        <div class="mb-4">
            <Label for="shortname" class="mb-2">
                <span class="text-red-500 text-lg" style="vertical-align: center">*</span>
                Shortname
            </Label>
            <Input required id="shortname" placeholder="Short name" bind:value={formData.shortname} />
            <p class="text-xs text-gray-500 mt-1">A shortname (use 'auto' for auto generated shortname)</p>
        </div>

        <div class="mb-4">
            <div class="flex items-center gap-2">
                <Checkbox id="is_active" bind:checked={formData.is_active} />
                <Label for="is_active" class="mb-0">Active</Label>
            </div>
            <p class="text-xs text-gray-500 mt-1">Whether this item is currently active</p>
        </div>

        <div class="mb-4">
            <Label for="slug" class="mb-2">Slug</Label>
            <Input id="slug" placeholder="url-friendly-name" bind:value={formData.slug} />
            <p class="text-xs text-gray-500 mt-1">A URL-friendly version of the short name</p>
        </div>

        <Accordion>
            <AccordionItem>
                <span slot="header" class="font-medium">Translations</span>
                {#snippet header()}Displayname and Description Translations{/snippet}
                <div class="p-4 space-y-4">
                    <div class="mb-4">
                        <Label class="mb-2">Display name</Label>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label class="text-sm">English</Label>
                                <Input bind:value={formData.displayname.en} />
                            </div>
                            <div>
                                <Label class="text-sm">Arabic</Label>
                                <Input bind:value={formData.displayname.ar} />
                            </div>
                            <div>
                                <Label class="text-sm">Kurdish</Label>
                                <Input bind:value={formData.displayname.ku} />
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <Label class="mb-2">Description</Label>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label class="text-sm">English</Label>
                                <Textarea bind:value={formData.description.en} rows={3} />
                            </div>
                            <div>
                                <Label class="text-sm">Arabic</Label>
                                <Textarea bind:value={formData.description.ar} rows={3} />
                            </div>
                            <div>
                                <Label class="text-sm">Kurdish</Label>
                                <Textarea bind:value={formData.description.ku} rows={3} />
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>
        </Accordion>
    </form>
</Card>