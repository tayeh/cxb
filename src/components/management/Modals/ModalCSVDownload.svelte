<script lang="ts">
    import { Button, Label, Modal, Input } from "flowbite-svelte";
    import {Dmart} from "@edraj/tsdmart";
    import downloadFile from "@/utils/downloadFile";
    import {Level, showToast} from "@/utils/toast";
    import {currentListView} from "@/stores/global";

    let { isOpen = $bindable(), space_name, subpath } = $props();

    let limit = $state("");
    let startDate = $state("");
    let endDate = $state("");


    let isCSVDownloadInProgress = $state(false);
    async function handleDownloadCSV() {
        try {
            isCSVDownloadInProgress = true;

            const query = { ...$currentListView.query };

            if (limit) {
                query.limit = parseInt(limit);
            }

            if (startDate) {
                query.from_date = startDate;
            }

            if (endDate) {
                query.to_date = endDate;
            }

            const data = await Dmart.csv(query);
            downloadFile(data, `${space_name}/${subpath}.csv`, "text/csv");
        } catch (e) {
            showToast(Level.warn);
        } finally {
            isCSVDownloadInProgress = false;
        }
    }
</script>

<Modal bind:open={isOpen} size="xs" autoclose={false} class="w-full">
    <div class="">
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            CSV Download Options
        </h3>

        <div class="mb-4">
            <Label for="limit" class="mb-2">Limit</Label>
            <Input id="limit" type="number" placeholder="Enter limit" bind:value={limit} min="1" />
        </div>

        <div class="mb-4">
            <Label for="startDate" class="mb-2">Start Date</Label>
            <Input id="startDate" type="date" bind:value={startDate} />
        </div>

        <div class="mb-4">
            <Label for="endDate" class="mb-2">End Date</Label>
            <Input id="endDate" type="date" bind:value={endDate} />
        </div>

        <div class="flex justify-center gap-4">
            <Button color="alternative" onclick={() => isOpen = false}>Cancel</Button>
            <Button class="bg-primary" disabled={isCSVDownloadInProgress} onclick={handleDownloadCSV}>Download</Button>
        </div>
    </div>
</Modal>