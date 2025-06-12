<script>
    import { goto } from '@roxi/routify';
    import {Dmart} from "@edraj/tsdmart";
    import {website} from "@/config";
    import axios from "axios";
    import Login from "@/components/Login.svelte";
    import ManagementHeader from "@/components/management/ManagementHeader.svelte";
    import {Level} from "@/utils/toast";
    import {debouncedShowToast} from "@/utils/debounce";
    import {Spinner} from "flowbite-svelte";
    import {getSpaces} from "@/lib/dmart_services.js";
    import {onMount} from "svelte";
    $goto

    const dmartAxios = axios.create({
        baseURL: website.backend,
        withCredentials: true,
        timeout: 30000,

    });
    dmartAxios.interceptors.response.use((request) => {
        if(request.status === 401){
            $goto("/login");
        }
        return request;
    }, (error) => {
        if(error.code === 'ERR_NETWORK'){
            debouncedShowToast(Level.warn, "Network error.Please check your connection or the server is down.");
        }
        return Promise.reject(error);
    });
    Dmart.setAxiosInstance(dmartAxios);
    onMount(() => {
        getSpaces();
    });
</script>
{#await Dmart.get_profile()}
    <div class="flex w-svw h-svh justify-center items-center">
        <Spinner color="blue" size="16" />
    </div>
{:then _}
    <ManagementHeader />
    <slot />
{:catch _}
    <Login />
{/await}
