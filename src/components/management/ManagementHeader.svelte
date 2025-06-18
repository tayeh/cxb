<script lang="ts">
    import {
        Navbar,
        NavLi,
        NavUl,
        Avatar,
        Button,
        Badge,
        Dropdown,DropdownItem,DropdownDivider,
    } from 'flowbite-svelte';
    import {
        FolderSolid,
        UserSettingsSolid,
        ChartMixedOutline,
        BellOutline,
        UserSolid,OpenDoorOutline
    } from 'flowbite-svelte-icons';
    import {goto,} from '@roxi/routify';
    $goto
    import {signout, user} from "@/stores/user";
    import {getAvatar} from "@/lib/dmart_services";

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

<Navbar class="px-1 border-b border-gray-200">
    <NavUl class="flex flex-row gap-8 mr-auto">
        <NavLi class="flex items-center gap-1 relative" href="/management/content">
            <FolderSolid size="md"/>
            <span>Content</span>
            {#if window.location.pathname.includes('/management/content')}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
            {/if}
        </NavLi>
        <NavLi class="flex items-center gap-1 relative" href="/management/tools">
            <UserSettingsSolid size="md"/>
            <span>Tools</span>
            {#if window.location.pathname.includes('/management/tools')}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
            {/if}
        </NavLi>
        <NavLi class="flex items-center gap-1 relative" href="/management/analytics">
            <ChartMixedOutline size="md"/>
            <span>Analytics</span>
            {#if window.location.pathname.includes('/management/analytics')}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
            {/if}
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
                <DropdownItem onclick={(e) => goToProfile(e)}>
                    <div class="flex items-center gap-2">
                        <UserSolid size="sm" /> My Profile
                    </div>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onclick={(e) => logout(e)}>
                    <div class="flex items-center gap-2 text-red-600">
                        <OpenDoorOutline size="sm" /> Logout
                    </div>
                </DropdownItem>
            </Dropdown>
        </Button>



<!--TODO: impl messaging-->
        <!--        <Button pill size="sm" color="light" class="p-2">-->
        <!--            <MessagesSolid size="md" />-->
        <!--        </Button>-->
        <!--TODO: impl notifications-->
<!--        <Button pill size="sm" color="light" class="p-2 relative">-->
<!--            <BellOutline size="md"/>-->
<!--            <Badge color="red" class="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">?</Badge>-->
<!--        </Button>-->
    </div>
</Navbar>

<style>

</style>