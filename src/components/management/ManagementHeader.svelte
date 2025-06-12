<script lang="ts">
    import {
        Navbar,
        NavLi,
        NavUl,
        Avatar,
        Button,
        Badge
    } from 'flowbite-svelte';
    import {
        FolderSolid,
        UserSettingsSolid,
        ChartMixedOutline,
        BellOutline
    } from 'flowbite-svelte-icons';
    import { isActive } from '@roxi/routify';

    function setLanguage(lang: string) {
        currentLang = lang;
    }

    const user = {
        name: "John Doe",
        avatar: "https://flowbite.com/docs/images/people/profile-picture-5.jpg"
    };

    let currentLang = "EN";
    let currentRoute = $state("");

    $effect(() => {
        currentRoute = $isActive('/management/content') ? '/management/content' :
                       $isActive('/management/tools') ? '/management/tools' :
                       $isActive('/management/analytics') ? '/management/analytics' : '';
    });

</script>

<Navbar class="px-1 border-b border-gray-200">
    <NavUl class="flex flex-row gap-8 mr-auto">
        <NavLi class="flex items-center gap-1 relative" href="/management/content">
            <FolderSolid size="md"/>
            <span>Content</span>
            {#if currentRoute === '/management/content'}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
            {/if}
        </NavLi>
        <NavLi class="flex items-center gap-1 relative" href="/management/tools">
            <UserSettingsSolid size="md"/>
            <span>Tools</span>
            {#if currentRoute === '/management/tools'}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
            {/if}
        </NavLi>
        <NavLi class="flex items-center gap-1 relative" href="/management/analytics">
            <ChartMixedOutline size="md"/>
            <span>Analytics</span>
            {#if currentRoute === '/management/analytics'}
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
            <Avatar src={user.avatar} size="xs" class="ring-2 ring-white"/>
            <span class="text-sm">{user.name}</span>
        </Button>

        <!--        <Button pill size="sm" color="light" class="p-2">-->
        <!--            <MessagesSolid size="md" />-->
        <!--        </Button>-->

        <Button pill size="sm" color="light" class="p-2 relative">
            <BellOutline size="md"/>
            <Badge color="red" class="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">?</Badge>
        </Button>
    </div>
</Navbar>

<style>

</style>