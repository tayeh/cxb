<script lang="ts">
  import {_} from "@/i18n";
  import {Engine, functionCreateDatatable, Pagination, RowsPerPage, Sort,} from "svelte-datatables-net";
  import {Dmart, QueryType, SortyType} from "@edraj/tsdmart";
  import cols from "@/utils/jsons/list_cols.json";
  import {searchListView} from "@/stores/management/triggers";
  import Prism from "@/components/Prism.svelte";
  import {goto, params} from "@roxi/routify";
  import {fade} from "svelte/transition";
  import {isDeepEqual} from "@/utils/compare";
  import {folderRenderingColsToListCols} from "@/utils/columnsUtils";
  import {
    Button,
    Checkbox,
    Modal,
    Table,
    TableBodyRow,
    TableBody,
    TableBodyCell,
    TableHead,
    TableHeadCell,
    ListPlaceholder,
  } from "flowbite-svelte";
  import {bulkBucket} from "@/stores/management/bulk_bucket";
  import {spaces} from "@/stores/management/spaces";
  import {getSpaces} from "@/lib/dmart_services";
  import {Level, showToast} from "@/utils/toast";
  import ListViewActionBar from "@/components/management/ListViewActionBar.svelte";
  import {currentListView} from "@/stores/global";
  import {untrack} from "svelte";
  import {user} from "@/stores/user";
  $goto

  $bulkBucket = [];

  let {
    space_name = $bindable(),
    subpath = $bindable(),
    shortname = $bindable(null),
    type = $bindable(QueryType.search),
    folderColumns = $bindable(null),
    sort_by = $bindable(null),
    sort_order = $bindable(null),
    is_clickable = $bindable(true),
    canDelete = $bindable(false),
    exact_subpath = $bindable(true),
    scope = $bindable("managed"),
  } : {
    space_name?: string,
    subpath?: string,
    shortname?: string,
    type?: QueryType,
    folderColumns?: any,
    sort_by?: string,
    sort_order?: string,
    is_clickable?: boolean,
    canDelete?: boolean,
    exact_subpath?: boolean,
    scope?: string,
  } = $props();

  $currentListView = {fetchPageRecords};

  let columns = $state(null);

  if (folderColumns === null || folderColumns.length === 0) {
      columns = cols;
  } else {
      columns = folderRenderingColsToListCols(folderColumns);
  }

  let total: number = $state(null);
  const { sortBy, sortOrder, page } = $params;
  let sort = {
      sort_by: (sortBy ?? sort_by) || "shortname", // descending
      sort_order: (sortOrder ?? sort_order) || "ascending",
  };

  let objectDatatable = $state(
      functionCreateDatatable({
          parData: [],
          parRowsPerPage: (typeof localStorage !== 'undefined' && localStorage.getItem("rowPerPage") as `${number}`) || "15",
          parSearchString: "",
          parSortBy: (sortBy ?? sort_by) || "shortname",
          parSortOrder: (sortOrder ?? sort_order) || "ascending",
          parActivePage: Number(page) || 1,
      })
  );

  $effect(() => {
      objectDatatable.arraySearchableColumns = Object.keys(columns);
  });

  function value(path: string, data, type) {
    if (data === null) {
      return $_("not_applicable");
    }
    if (path.length == 1 && path[0].length > 0 && typeof(data) === "object" && path[0] in data) {
      if (type == "json") return JSON.stringify(data[path[0]], undefined, 1);
      else return data[path[0]];
    }
    if (path.length > 1 && path[0].length > 0 && path[0] in data) {
      return value(path.slice(1), data[path[0]], type);
    }
    return $_("not_applicable");
  }

  let height: number = $state(0);
  let numberActivePage: number = page || 1;
  let propNumberOfPages: number = $state(1);
  let numberRowsPerPage: number =
    parseInt(typeof localStorage !==  'undefined' && localStorage.getItem("rowPerPage")) || 15;
  let paginationBottomInfoFrom = $derived(
      objectDatatable.numberRowsPerPage *  (objectDatatable.numberActivePage - 1) + 1
  );
  let paginationBottomInfoTo = $derived(
      (objectDatatable.numberRowsPerPage * objectDatatable.numberActivePage) >= total ? total : (
          objectDatatable.numberRowsPerPage * objectDatatable.numberActivePage
      )
  );

  function setQueryParam(pair: any) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    let href = window.location.pathname + "?";

    for (const [k, v] of Object.entries(pair)) {
      if (urlSearchParams.has(k)) {
        urlSearchParams.delete(k);
      }
      if (typeof(v)==="string") {
        urlSearchParams.set(k, v);
      }
    }

    if (window.location.search === "") {
        href += urlSearchParams.toString();
      } else {
        href += "&" + urlSearchParams.toString();
      }
    //TODO: Fix this, url not being updated
    window.history.replaceState(history.state, '', href)
  }

  function setNumberOfPages() {
    propNumberOfPages = Math.ceil(total / numberRowsPerPage);
    localStorage.setItem("rowPerPage", numberRowsPerPage.toString());
  }

  let old_search = "";
  let queryObject: any = {};
  async function fetchPageRecords(isSetPage = true, requestExtra = {}) {
    let _search = $searchListView;

    if(subpath==="/") {
      if($spaces === null || $spaces.length === 0){
        await getSpaces();
      }
      const currentSpace = $spaces.find((e) => e.shortname === space_name);
      const hideFolders = currentSpace.attributes.hide_folders;

      if(hideFolders.length){
        _search += ` -@shortname:${hideFolders.join('|')}`;
      }
    }

    queryObject = {
      filter_shortnames: shortname ? [shortname] : [],
      type,
      space_name: space_name,
      subpath: subpath,
      exact_subpath: exact_subpath,
      limit: objectDatatable.numberRowsPerPage,
      sort_by: objectDatatable.stringSortBy.toString(),
      sort_type: SortyType[objectDatatable.stringSortOrder],
      offset:
              objectDatatable.numberRowsPerPage *
              (objectDatatable.numberActivePage - 1),
      search: _search.trim(),
      ...requestExtra,
      retrieve_json_payload: true
    }

    const resp = await Dmart.query(queryObject, scope);

    old_search = $searchListView;
    total = resp.attributes.total;
    objectDatatable.arrayRawData = resp.records;
    if (isSetPage) {
      if (objectDatatable.arrayRawData.length === 0) {
        propNumberOfPages = 0;
      } else {
        setNumberOfPages();
      }
    }
  }

  let modalData: any = $state({});
  let open = $state(false);

  function redirectToEntry(record: any) {
    const shortname = record.shortname;
    const schema_shortname = record.attributes?.payload?.schema_shortname;
    let tmp_subpath = record.subpath.replaceAll("/", "-");

    $goto(
      "/management/content/[space_name]/[subpath]/[shortname]/[resource_type]",
      {
        space_name: space_name,
        subpath: tmp_subpath,
        shortname: shortname,
        resource_type: record.resource_type,
      }
    );

  }

  async function onListClick(event: any, record: any) {
    if (!is_clickable) {
      return;
    }

    if (type === QueryType.events) {
      open = true;

      const blacklist = ["sec", "content-type", "accept", "host", "connection"];
      modalData = JSON.parse(JSON.stringify(record));

      if (modalData?.attributes?.attributes?.request_headers) {
        modalData.attributes.attributes.request_headers = Object.keys(
          modalData.attributes.attributes.request_headers
        ).reduce(
          (acc, key) =>
            blacklist.some((item) => key.includes(item))
              ? acc
              : {
                  ...acc,
                  [key]: modalData.attributes.attributes.request_headers[key],
                },
          {}
        );
      }
      return;
    }

    if (record.resource_type === "folder") {
      let _subpath = `${record.subpath}/${record.shortname}`.replace(
        /\/+/g,
        "/"
      );

      if (_subpath.length > 0 && subpath[0] === "/") {
          _subpath = _subpath.substring(1);
      }
      if (_subpath.length > 0 && _subpath[_subpath.length - 1] === "/") {
          _subpath = _subpath.slice(0, -1);
      }

      $goto("/management/content/[space_name]/[subpath]", {
          space_name: space_name,
          subpath: _subpath.replaceAll("/", "-"),
      });

      return;
    }

    redirectToEntry(record);
  }

  $effect(() => {
    if (
      old_search !== $searchListView &&
      type !== QueryType.history &&
      objectDatatable
    ) {
      untrack(()=>{
        fetchPageRecords(true);
      });
    }
  });

  $effect(() => {
    if (objectDatatable) {
      if (
        !isDeepEqual(sort, {
          sort_by: objectDatatable.stringSortBy,
          sort_order: objectDatatable.stringSortOrder,
        })
      ) {
        const x = {
          sort_by: objectDatatable.stringSortBy.toString(),
          sort_order: objectDatatable.stringSortOrder,
        };
        setQueryParam({
          sortBy: objectDatatable.stringSortBy.toString(),
          sortOrder: objectDatatable.stringSortOrder,
        });

        untrack(()=>{
          fetchPageRecords(true, {
            sort_by: objectDatatable.stringSortBy.toString(),
            sort_type: objectDatatable.stringSortOrder,
          });
        });
        sort = structuredClone(x);
      }
    }
  });

  $effect(() => {
      if (objectDatatable.numberRowsPerPage !== numberRowsPerPage) {
          numberRowsPerPage = objectDatatable.numberRowsPerPage;
          if (typeof localStorage !== 'undefined') {
              localStorage.setItem("rowPerPage", numberRowsPerPage.toString());
          }
          (async() => {
              await fetchPageRecords(true);
              handleAllBulk(null, isAllBulkChecked);
          })();
      }

      if (objectDatatable.numberActivePage !== numberActivePage) {
          setQueryParam({page: objectDatatable.numberActivePage.toString()});
          numberActivePage = objectDatatable.numberActivePage;
          (async() => {
              await fetchPageRecords(false);
              handleAllBulk(null, false);
          })();
      }
  });

  const toggleModal = () => {
      open = !open;
  }

  function handleBulk(event: any) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
      try {
          const { name, checked } = event.target;
          const _shortname = objectDatatable.arrayRawData[name].shortname;
          if (checked) {
              const _resource_type = objectDatatable.arrayRawData[name].resource_type;
              $bulkBucket = [...$bulkBucket, {shortname: _shortname, resource_type: _resource_type, subpath: objectDatatable.arrayRawData[name].subpath}];
          }
          else {
              $bulkBucket = $bulkBucket.filter(e=> e.shortname !== objectDatatable.arrayRawData[name].shortname);
          }
      } catch (e){
        showToast(Level.warn, 'Error processing bulk selection');
        e.target.checked = false;
      }
  }

  let isAllBulkChecked = false;
  function handleAllBulk(e, override = null) {
      isAllBulkChecked = override === null ? !isAllBulkChecked : override;
      if (e) {
          e.target.checked = isAllBulkChecked;
      }

      objectDatatable.arrayRawData.map((e, i) => {
          const _shortname = e.shortname;

          const input: any = document.getElementById(_shortname);
          if (input === null) return;
          input.checked = isAllBulkChecked;

          if (input.checked) {
              const _resource_type = objectDatatable.arrayRawData[i].resource_type;
              $bulkBucket = [...$bulkBucket, {shortname: _shortname, resource_type: _resource_type}];
          }
          else {
              $bulkBucket = $bulkBucket.filter(e=> e.shortname !== objectDatatable.arrayRawData[i].shortname);
          }
      });
  }

  function handleSortRendered(node) {
    setTimeout(() => {
      const spanButton = node.querySelector('span[role="button"][style*="cursor:pointer"][style*="white-space: nowrap"]');
      if (spanButton) {
        spanButton.style.cssText = "cursor:pointer;display: flex;white-space: nowrap;";

        const children = Array.from(spanButton.childNodes);
        spanButton.innerHTML = '';

        children.reverse().forEach((child:any) => {
          if (child.nodeName === 'svg') {
            child.classList.add('mr-2');
          }
          spanButton.appendChild(child);
        });
      }
    }, 0);

    return {
      destroy() {}
    };
  }

  $effect(() => {
    if(queryObject){
      untrack(() => {
        $currentListView.query = queryObject;
      });
    }
  })
</script>

<Modal
  bind:open={open}
  size={"lg"}
>
<!--    <ModalHeader toggle={toggleModal}>{}</ModalHeader>-->

  <div class="modal-header">
    <h5 class="modal-title">
      {modalData.shortname}
    </h5>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <button type="button" onclick={toggleModal} class="btn-close" aria-label="Close">
    </button>
  </div>

  <div>
    <Prism code={modalData} />
  </div>
  <div>
    <Button color="secondary" onclick={() => (open = false)}>Close</Button>
    <Button
      color="primary"
      onclick={() => {
        open = false;
        redirectToEntry(modalData);
      }}>Entry</Button
    >
  </div>
</Modal>

<svelte:window bind:innerHeight={height} />

{#if type !== QueryType.events}
  <ListViewActionBar {space_name} {subpath} />
{/if}


{#await fetchPageRecords()}
  <div class="flex flex-col w-full">
    <ListPlaceholder class="m-5" size="lg" style="width: 100vw"/>
  </div>
{:then _}
  <div class="w-full">
    {#if total === null}
      <ListPlaceholder class="m-5" size="lg" style="width: 100vw"/>
    {:else}
      {#if objectDatatable}
        <Engine bind:propDatatable={objectDatatable} />
      {/if}
      <div class="mx-3" transition:fade={{ delay: 25 }}>
        {#if objectDatatable?.arraySearched.length === 0}
          <div class="text-center pt-5 text-lg font-semibold text-gray-700">
            No records found.
          </div>
        {:else}
          <Table striped={true} class="border-collapse border w-full border-gray-300 mt-2">
            <TableHead class="bg-gray-100">
              {#if canDelete}
                <TableHeadCell class="p-2 border border-gray-300">
                  <Checkbox class="bg-white" onchange={handleAllBulk} />
                </TableHeadCell>
              {/if}
              {#each Object.keys(columns) as col}
                <TableHeadCell class="border border-gray-300">
                  <div use:handleSortRendered>
                  <Sort bind:propDatatable={objectDatatable} propColumn={col}>
                    {columns[col].title}
                  </Sort>
                  </div>
                </TableHeadCell>
              {/each}
            </TableHead>
            <TableBody>
              {#each objectDatatable.arrayRawData as row, index}
                <TableBodyRow class="hover:bg-gray-200" onclick={(e) => onListClick(e, row)}>
                  <div style="all: unset;display: contents;">
                    {#if canDelete}
                      <span style="all: unset;display: contents;" onclick={(e) => {
                          e.stopPropagation();
                          const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
                          if (checkbox) {
                            checkbox.checked = !checkbox.checked;
                            const event = new Event('change', { bubbles: true });
                            checkbox.dispatchEvent(event);
                          }
                        }}>
                        <TableBodyCell class="p-2 border border-gray-300">
                          <Checkbox class="bg-white" id={row.shortname} name={index.toString()}
                                    checked={$bulkBucket.some(e => e.shortname === row.shortname)}
                                    onchange={handleBulk}
                                    onclick={(e) => e.stopPropagation()}
                          />
                        </TableBodyCell>
                      </span>
                    {/if}
                    {#each Object.keys(columns) as col}
                      <TableBodyCell class="p-2 border border-gray-300 cursor-pointer">
                        {value(columns[col].path.split("."), row, columns[col].type)}
                      </TableBodyCell>
                    {/each}
                  </div>
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
          <div class="flex flex-col md:flex-row justify-between items-center mt-4">
            <RowsPerPage
                    bind:propDatatable={objectDatatable}
                    class="form-select form-select-sm w-auto"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </RowsPerPage>
            <p class="text-sm text-gray-600">
              Showing {paginationBottomInfoFrom} to {paginationBottomInfoTo} of {total} entries
            </p>
            <Pagination
                bind:propDatatable={objectDatatable}
                bind:propNumberOfPages
                maxPageDisplay={5}
                propSize="default"
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/await}
