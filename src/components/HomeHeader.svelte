<script lang="ts">
    import {
        Avatar,
        Button,
        Dropdown,
        DropdownItem,
        DropdownDivider,
    } from 'flowbite-svelte';
    import {
        HomeSolid,
        ToggleHeaderRowOutline,
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

<div class="flex items-center justify-between border-b border-gray-200 px-5">
    <ul class="flex flex-row mr-auto">
        <li>
            <a href="/" class="flex items-center p-0 my-3">
                <HomeSolid size="lg"/>
                <span> Dmart</span>
            </a>
        </li>
    </ul>

    <div class="flex items-center gap-4">
<!--        TODO-->
<!--        <div class="flex rounded-full bg-gray-100 p-1">-->
<!--            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all-->
<!--                    {currentLang === 'EN' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"-->
<!--                    onclick={() => setLanguage('EN')}>-->
<!--                EN-->
<!--            </button>-->
<!--            <button class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all-->
<!--                    {currentLang === 'AR' ? 'bg-white border-2 border-primary shadow-sm' : 'text-gray-600 hover:color-primary'}"-->
<!--                    onclick={() => setLanguage('AR')}>-->
<!--                AR-->
<!--            </button>-->
<!--        </div>-->
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
</div>