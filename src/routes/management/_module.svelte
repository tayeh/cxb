<script>
    import {signout, user} from "@/stores/user";
    import {onMount} from "svelte";
    import { goto } from '@roxi/routify';
    import {Dmart} from "@edraj/tsdmart";
    import {website} from "@/config";
    import axios from "axios";
    import Login from "@/components/Login.svelte";
    import ManagementHeader from "@/components/management/ManagementHeader.svelte";
    import {getSpaces} from "@/lib/dmart_services.js";
    $goto

    axios.defaults.baseURL = website.backend;

    axios.interceptors.response.use((config) => {
        if(config.status === 401){
            $goto("/login");
        }
        return config;
    });

    onMount(async () => {
        getSpaces();
    });
</script>
{#await Dmart.get_profile()}
    {:then _}
        <ManagementHeader />
        <slot />
    {:catch _}
    <Login />
{/await}


<style lang="postcss">
    @reference "tailwindcss";
    :global(html) {
        background-color: theme(--color-gray-100);
    }
</style>