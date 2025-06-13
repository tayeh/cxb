<script lang="ts">
  import {
    Label,
    Input,
    Button,
    Heading,
    ButtonGroup,
    InputAddon,
    Spinner,
  } from "flowbite-svelte";
  import { EyeSolid, EyeSlashSolid } from 'flowbite-svelte-icons';
  import { signin } from "@/stores/user";
  import { _ } from "@/i18n";
  import { goto } from "@roxi/routify";
  $goto

  let username: string;
  let password: string;
  let isError: boolean = $state(false);
  let showPassword: boolean = $state(false);
  let isLoginLoading: boolean = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isError = false;
      isLoginLoading = false;
    try {
        isLoginLoading = true;
      await signin(username, password);
      window.location.href = "/management/content";
    } catch (error) {
      isError = true;
    }
    isLoginLoading = false;
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<div class="flex row h-svh">
  <div class="flex justify-center w-1/2 p-12 flex flex-col">
    <Heading class="text-primary">
      Welcome back <br>
      log in to your account
    </Heading>

    <form onsubmit={handleSubmit} class="mt-12">
        <Label for="username">{$_("username")}</Label>
        <Input
          id="username"
          placeholder={$_("shortname")}
          type="text"
          bind:value={username}
          color={isError ? "red" : "default"}
          required
        />
        <div class="mt-6"></div>
        <Label for="password">{$_("password")}</Label>
        <ButtonGroup class="w-full">
            <Input
              id="password"
              placeholder={$_("password")}
              type={showPassword ? "text" : "password"}
              bind:value={password}
              color={isError ? "red" : "default"}
              minlength={8}
              maxlength={24}
              required
            />
          <InputAddon>
            <Button class="absolute inset-y-0 right-0 flex items-center px-3" color="light"
                    onclick={togglePasswordVisibility} aria-controls="password">
              {#if showPassword}
                <EyeSolid />
              {:else}
                <EyeSlashSolid />
              {/if}
            </Button>
          </InputAddon>
        </ButtonGroup>
      <div class="mt-6"></div>
        <Button type="submit" class="w-full bg-primary" style="cursor: pointer">
            {#if isLoginLoading}
                <Spinner class="me-3" size="4" color="blue" />
                Loading ...
            {:else}
                {$_("login")}
            {/if}
        </Button>
        {#if isError}
            <p class="text-red-600 mt-2">{$_("login_error")}</p>
        {/if}
    </form>
  </div>
  <div class="flex content-center items-center justify-center w-1/2 bg-primary"></div>
</div>