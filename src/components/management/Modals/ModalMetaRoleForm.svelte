<script lang="ts">
    import {
        Accordion,
        AccordionItem,
        Button,
        Card,
        Helper,
        Input,
        Label,
        ListPlaceholder,
        Select
    } from 'flowbite-svelte';
    import {PlusOutline} from 'flowbite-svelte-icons';
    import {onMount} from 'svelte';
    import {Dmart, QueryType} from '@edraj/tsdmart';

    let {
        formData = $bindable(),
        validateFn = $bindable()
    } = $props();

    let form;
    let availableRoles = [];
    let loading = $state(true);
    let newPermission = '';

    // Initialize form data with defaults if needed
    formData = {
        ...formData,
        permissions: formData.permissions || []
    };

    // Load available roles from Dmart on component mount
    onMount(async () => {
        try {
            const response: any = await Dmart.query({
                space_name: 'management',
                subpath: '/roles',
                type: QueryType.search,
                search: '',
                limit: 100,
            });
            if (response && response.data) {
                availableRoles = response.data;
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            loading = false;
        }
    });

    function addPermission() {
        if (newPermission && !formData.permissions.includes(newPermission)) {
            formData.permissions = [...formData.permissions, newPermission];
            newPermission = '';
        }
    }

    function removePermission(permission) {
        formData.permissions = formData.permissions.filter(p => p !== permission);
    }

    function validate() {
        const isValid = form.checkValidity();

        if (!isValid) {
            form.reportValidity();
        }

        return isValid;
    }

    $effect(() => {
        validateFn = validate;
    });
</script>

<Card class="w-full max-w-4xl mx-auto p-4">
    <h2 class="text-2xl font-bold mb-4">Role Permissions</h2>

    <form bind:this={form} class="space-y-4">
        <div class="mb-4">
            <Label for="role_name" class="mb-2">
                <span class="text-red-500 text-lg" style="vertical-align: center">*</span>
                Role Name
            </Label>
            <Input
                   id="role_name"
                   placeholder="Enter role name"
                   bind:value={formData.name} />
        </div>

        <div class="mb-4">
            <Label for="role_description" class="mb-2">Description</Label>
            <Input
                    id="role_description"
                    placeholder="Role description"
                    bind:value={formData.description} />
        </div>

        <div class="mb-4">
            <Label class="mb-2">
                <span class="text-red-500 text-lg" style="vertical-align: center">*</span>
                Permissions
            </Label>
            <div class="flex space-x-2">
                <Select
                        id="permission_select"
                        class="flex-grow"
                        placeholder="Select permission to add"
                        items={availableRoles.map(role => ({ name: role.name, value: role.id }))}
                        bind:value={newPermission} />
                <Button class="bg-primary" size="sm" onclick={addPermission}>
                    <PlusOutline size="md" />
                </Button>
            </div>
            <Helper>Select permissions from the dropdown or add custom ones</Helper>

            {#if loading}
                <div class="mt-4">
                    <ListPlaceholder />
                </div>
            {/if}

            {#if formData.permissions.length > 0}
                <div class="mt-4">
                    <Label class="mb-2">Added Permissions</Label>
                    <div class="border rounded-lg p-4 bg-gray-50">
                        <div class="flex flex-wrap gap-2">
                            {#each formData.permissions as permission}
                                <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                                    <span>{permission}</span>
                                    <button
                                            class="ml-2 text-blue-600 hover:text-blue-800"
                                            onclick={() => removePermission(permission)}
                                            type="button">
                                        ×
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else}
                <div class="mt-4 p-4 border border-dashed rounded-lg text-center text-gray-500">
                    No permissions added
                </div>
            {/if}
        </div>

        <Accordion>
            <AccordionItem>
                {#snippet header()}Advanced Settings{/snippet}
                <div class="p-4 space-y-4">
                    <div class="mb-4">
                        <Label for="role_priority" class="mb-2">Priority Level</Label>
                        <Input
                                id="role_priority"
                                type="number"
                                min="1"
                                max="100"
                                placeholder="Priority (1-100)"
                                bind:value={formData.priority} />
                        <Helper>Higher numbers indicate higher priority</Helper>
                    </div>

                    <div class="mb-4">
                        <Label for="parent_role" class="mb-2">Parent Role</Label>
                        <Select
                                id="parent_role"
                                placeholder="Select parent role (optional)"
                                items={availableRoles.map(role => ({ name: role.name, value: role.id }))}
                                bind:value={formData.parent_role_id} />
                        <Helper>Child roles inherit permissions from parent roles</Helper>
                    </div>
                </div>
            </AccordionItem>
        </Accordion>
    </form>
</Card>