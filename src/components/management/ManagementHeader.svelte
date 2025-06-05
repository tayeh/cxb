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
        MessagesSolid,
        BellOutline
    } from 'flowbite-svelte-icons';

    function setLanguage(lang: string) {
        currentLang = lang;
    }

    const user = {
        name: "John Doe",
        avatar: "https://flowbite.com/docs/images/people/profile-picture-5.jpg"
    };

    let currentLang = "EN";

</script>

<Navbar class="px-1 border-b border-gray-200">
    <NavUl class="flex flex-row gap-8 mr-auto">
        <NavLi href="/management/content" class="flex items-center gap-1">
            <FolderSolid size="md" />
            <span>Content</span>
        </NavLi>
        <NavLi href="/management/tools" class="flex items-center gap-1">
            <UserSettingsSolid size="md" />
            <span>Tools</span>
        </NavLi>
        <NavLi href="/management/analytics" class="flex items-center gap-1">
            <ChartMixedOutline size="md" />
            <span>Analytics</span>
        </NavLi>
    </NavUl>

    <div class="flex items-center gap-4">
        <div class="flex rounded-full bg-gray-100 p-1">
            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    {currentLang === 'EN' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"
                    on:click={() => setLanguage('EN')}>
                EN
            </button>
            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    {currentLang === 'AR' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"
                    on:click={() => setLanguage('AR')}>
                AR
            </button>
        </div>

        <Button pill color="light" class="flex items-center gap-2 py-1 px-3">
            <Avatar src={user.avatar} size="xs" class="ring-2 ring-white" />
            <span class="text-sm">{user.name}</span>
        </Button>

<!--        <Button pill size="sm" color="light" class="p-2">-->
<!--            <MessagesSolid size="md" />-->
<!--        </Button>-->

        <Button pill size="sm" color="light" class="p-2 relative">
            <BellOutline size="md" />
            <Badge color="red" class="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">?</Badge>
        </Button>
    </div>
</Navbar>