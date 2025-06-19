<script>
    import {Card, Select, TextPlaceholder} from "flowbite-svelte";
    import {Dmart, ResourceType} from "@edraj/tsdmart";

    let {
        space_name,
        meta,
        formData = $bindable(),
    } = $props();

    let ticket_status = $state(null);
    let ticket_action = $state(null);
    let resolution = $state(null);
    let comment = $state("");

    let ticketPayload = $state(null);
    let ticketStates = $state([]);
    let ticketResolutions = $state([]);

    async function get_ticket_payload() {
        ticketPayload = await Dmart.retrieve_entry(ResourceType.content, space_name, "workflows", meta.workflow_shortname, true)
        ticketPayload = ticketPayload.payload.body;

        if (ticketPayload) {
            ticketStates = ticketPayload.states.filter((e) => e.state === meta.state)[0]?.next;
            if ((ticketStates ?? []).length) {
                ticketResolutions = ticketPayload.states.filter((e) => e.state === ticket_status)[0]?.resolutions ?? [];
            }
        }
    }

    $effect(() => {
        ticket_action = ticketStates?.filter((e) => e.state === ticket_status)[0]?.action ?? null;
    });
    $effect(() => {
        if ((ticketStates ?? []).length) {
            ticketResolutions = ticketPayload.states.filter((e) => e.state === ticket_status)[0]?.resolutions ?? [];
        }
    });
</script>

<Card class="p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Ticket Form</h1>

    {#await get_ticket_payload()}
        <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
        <TextPlaceholder class="m-5" size="lg" style="width: 100vw"/>
    {:then _}
        {#if ticketStates.length}
            <Select items={ticketStates.map((state) => ({
            name: state.state,
            value: state.action,
        }))} bind:value={formData.action} class="mb-4"/>
        {/if}

        {#if ticketResolutions.length}
            <Select items={ticketResolutions.map((res) => ({
                name: res.name,
                value: res.name,
            }))} bind:value={formData.resolution}  class="mb-4"/>
        {/if}
    {/await}

</Card>