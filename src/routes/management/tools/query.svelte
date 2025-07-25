<script lang="ts">
    import {_} from "svelte-i18n";
    import {onMount} from "svelte";
    import downloadFile from "@/utils/downloadFile";
    import {Level, showToast} from "@/utils/toast";
    import {Dmart, type QueryRequest, QueryType} from "@edraj/tsdmart";
    import {getChildren} from "@/lib/dmart_services";
    import {
        Card,
        Label,
        Input,
        Button,
        Select,
        Checkbox
    } from 'flowbite-svelte';
    import {
        FilterSolid,
        FilterOutline
    } from 'flowbite-svelte-icons';
    import Aggregation from "@/components/management/tools/Aggregation.svelte";
    import { ResourceType } from "@edraj/tsdmart";
    import Prism from "@/components/Prism.svelte";

    let spaces = $state([]);
    let space_name: string = $state("");
    let queryType: QueryType = $state(null);
    let subpath: string = $state("/");
    let resource_type: ResourceType = $state(null);
    let resource_shortnames: string = $state("");
    let search: string = $state("");
    let from_date: string = $state("");
    let to_date: string = $state("");
    let offset: number = $state(0);
    let limit: number = $state(10);
    let retrieve_attachments: boolean = $state(false);
    let retrieve_json_payload: boolean = $state(false);

    let aggregation_data = $state({
        load: [],
        group_by: [],
        reducers: [],
    });

    let response = $state(null);
    let isDisplayFilter = $state(false);

    let selectedSpacename = null;
    let tempSubpaths = $state([]);
    let subpaths = $state([]);

    onMount(() => {
        async function setup() {
            spaces = (await Dmart.get_spaces()).records;
        }
        setup();
    });

    async function buildSubpaths(base: string, _subpaths: any) {
        for (const _subpath of _subpaths.records) {
            if (_subpath.resource_type === "folder") {
                const childSubpaths = await getChildren(space_name, _subpath.shortname);
                await buildSubpaths(`${base}/${_subpath.shortname}`, childSubpaths);
                tempSubpaths.push(`${base}/${_subpath.shortname}`);
            }
        }
    }

    async function handleResponse() {
        if (!space_name || !subpath || !queryType) {
            return;
        }

        const query_request: QueryRequest = {
            type: queryType,
            space_name,
            subpath,
            filter_types: resource_type ? [resource_type] : [],
            filter_shortnames: resource_shortnames ? resource_shortnames.split(",") : [],
            retrieve_attachments,
            retrieve_json_payload,
            exact_subpath: true,
            search,
            offset,
            limit,
        };

        if (from_date) {
            query_request.from_date = `${from_date}T00:00:00.000Z`;
        }
        if (to_date) {
            query_request.to_date = `${to_date}T00:00:00.000Z`;
        }

        response = await Dmart.query(query_request);
    }

    async function handleDownload() {
        const body: any = {
            space_name,
            subpath,
            type: "search",
            search: search || "",
            retrieve_json_payload: true,
            filter_types: resource_type ? [resource_type] : [],
            filter_shortnames: resource_shortnames
                ? resource_shortnames.split(",")
                : [],
            offset,
            limit,
        };

        if (from_date) {
            body.from_date = `${from_date}T00:00:00.000Z`;
        }
        if (to_date) {
            body.to_date = `${to_date}T00:00:00.000Z`;
        }

        const data = await Dmart.csv(body);
        if (data?.status === "failed") {
            showToast(Level.warn);
        } else {
            downloadFile(data, `${space_name}/${subpath}.csv`, "text/csv");
        }
    }

    $effect(() => {
        if (space_name && selectedSpacename !== space_name) {
            (async () => {
                subpaths = [];
                tempSubpaths = [];
                const _subpaths = await getChildren(space_name, "/");

                await buildSubpaths("", _subpaths);

                subpaths = [...tempSubpaths.reverse()];
                selectedSpacename = `${space_name}`;
            })();
        }
    });
</script>


<div class="min-w-11/12 m-6">
    <Card class="min-w-full p-4">
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div class="md:col-span-1 flex items-center justify-center">
                    <button
                            type="button"
                            class="text-blue-600 hover:text-blue-800 cursor-pointer"
                            onclick={() => (isDisplayFilter = !isDisplayFilter)}
                            aria-label="Toggle filter options"
                    >
                        {#if isDisplayFilter}
                            <FilterSolid size="xl" />
                        {:else}
                            <FilterOutline size="xl" />
                        {/if}
                    </button>
                </div>
                <div class="md:col-span-3">
                    <Label for="type" class="mb-2">{$_("query_type")}</Label>
                    <Select id="type" required bind:value={queryType}>
                        {#each Object.keys(QueryType) as _queryType}
                            <option value={_queryType}>{_queryType}</option>
                        {/each}
                    </Select>
                </div>
                <div class="md:col-span-4">
                    <Label for="space_name" class="mb-2">{$_("space_name")}</Label>
                    <Select id="space_name" bind:value={space_name}>
                        {#each spaces as space}
                            <option value={space.shortname}>{space.shortname}</option>
                        {/each}
                    </Select>
                </div>
                <div class="md:col-span-4">
                    <Label for="subpath" class="mb-2">{$_("subpath")}</Label>
                    <Select id="subpath" bind:value={subpath}>
                        <option value={"/"}>/</option>
                        {#each subpaths as path}
                            <option value={path}>{path}</option>
                        {/each}
                    </Select>
                </div>
            </div>

            {#if isDisplayFilter}
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <Label for="resource_type" class="mb-2">{$_("resource_types")}</Label>
                            <Select id="resource_type" bind:value={resource_type}>
                                <option value={null}></option>
                                {#each Object.keys(ResourceType) as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </Select>
                        </div>
                        <div>
                            <Label for="search" class="mb-2">{$_("search")}</Label>
                            <Input id="search" type="text" bind:value={search} />
                        </div>
                        <div>
                            <Label for="resource_shortnames" class="mb-2">{$_("shortnames")}</Label>
                            <Input id="resource_shortnames" type="text" bind:value={resource_shortnames} />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <Label for="from_date" class="mb-2">{$_("from")}</Label>
                            <Input id="from_date" type="date" bind:value={from_date} />
                        </div>
                        <div>
                            <Label for="to_date" class="mb-2">{$_("to")}</Label>
                            <Input id="to_date" type="date" bind:value={to_date} />
                        </div>
                        <div class="flex items-end">
                            <div class="flex items-center gap-2">
                                <Checkbox id="retrieve_attachments" bind:checked={retrieve_attachments} />
                                <Label for="retrieve_attachments" class="mb-0">{$_("retrieve_attachments")}</Label>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label for="limit" class="mb-2">{$_("limit")}</Label>
                            <Input id="limit" type="number" bind:value={limit} />
                        </div>
                        <div>
                            <Label for="offset" class="mb-2">{$_("offset")}</Label>
                            <Input id="offset" type="number" bind:value={offset} />
                        </div>
                        <div class="flex items-end">
                            <div class="flex items-center gap-2">
                                <Checkbox id="retrieve_json_payload" bind:checked={retrieve_json_payload} />
                                <Label for="retrieve_json_payload" class="mb-0">{$_("retrieve_json_payload")}</Label>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            {#if queryType === QueryType.aggregation}
                <div class="mb-4">
                    <Aggregation bind:aggregation_data />
                </div>
            {/if}

            <div class="flex justify-between">
                <Button onclick={handleResponse} color="blue">{$_("submit")}</Button>
                <Button color="blue" outline onclick={handleDownload}>{$_("download_csv")}</Button>
            </div>
        </div>
    </Card>
</div>

{#if response === null}
    <p class="text-gray-500 text-center">No response yet.</p>
{:else}
    <Prism bind:code={response} />
{/if}