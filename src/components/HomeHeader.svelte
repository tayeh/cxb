<script lang="ts">
    import {
        Navbar,
        NavLi,
        NavUl,
        Avatar,
        Button,
        Dropdown,DropdownItem,DropdownDivider,
    } from 'flowbite-svelte';
    import {
        FolderSolid,
        HomeSolid,
        ChartMixedOutline,
        ToggleHeaderRowOutline,
        UserSolid,OpenDoorOutline
    } from 'flowbite-svelte-icons';
    import {goto,} from '@roxi/routify';
    $goto
    import {signout, user} from "@/stores/user";
    import {getAvatar} from "@/lib/dmart_services";
    import ManagementHeader from "@/components/management/ManagementHeader.svelte";
    import Login from "@/components/Login.svelte";

    function setLanguage(lang: string) {
        currentLang = lang;
    }


    let currentLang = "EN";


    function goToProfile(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        $goto('/management/profile');
    }

    function logout(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        signout();
    }

</script>

<Navbar class="border-b border-gray-200" style="padding: 0!important;" >
    <NavUl class="flex flex-row mr-auto">
        <NavLi class="flex items-center" style="padding: 0!important;" href="/">
            <HomeSolid size="lg"/>
            <span> Dmart</span>
        </NavLi>
    </NavUl>

    <div class="flex items-center gap-4">
        <div class="flex rounded-full bg-gray-100 p-1">
            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    {currentLang === 'EN' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"
                    onclick={() => setLanguage('EN')}>
                EN
            </button>
            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    {currentLang === 'AR' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"
                    onclick={() => setLanguage('AR')}>
                AR
            </button>
        </div>
        {#if !$user || !$user.signedin}
            <Button class="bg-primary" onclick={()=>$goto('/management')} >Login</Button>
        {:else}
            <Button pill color="light" class="flex items-center gap-2 py-1 px-3">
                {#await getAvatar($user.shortname)}
                    <Avatar src={null} size="xs" class="ring-2 ring-white"/>
                {:then avatar}
                    <Avatar src={avatar} size="xs" class="ring-2 ring-white"/>
                {:catch error}
                    <Avatar src={null} size="xs" class="ring-2 ring-white"/>
                {/await}

                <span class="text-sm">{$user.shortname}</span>

                <Dropdown simple>
                    <DropdownItem onclick={(e) => $goto('/management')}>
                        <div class="flex items-center gap-2">
                            <ToggleHeaderRowOutline size="md" /> Dashboard
                        </div>
                    </DropdownItem>
                    <DropdownItem onclick={(e) => goToProfile(e)}>
                        <div class="flex items-center gap-2">
                            <UserSolid size="md" /> My Profile
                        </div>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onclick={(e) => logout(e)}>
                        <div class="flex items-center gap-2 text-red-600">
                            <OpenDoorOutline size="md" /> Logout
                        </div>
                    </DropdownItem>
                </Dropdown>
            </Button>
        {/if}

    </div>
</Navbar>

<style>

</style>