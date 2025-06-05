<script lang="ts">
  import {
    Card,
    Label,
    Input,
    Button,
  } from "flowbite-svelte";
  import { EyeSolid, EyeSlashSolid } from 'flowbite-svelte-icons';
    import { signin } from "@/stores/user";
    import { _ } from "@/i18n";

    let username: string;
    let password: string;
    let isError: boolean;
    let showPassword: boolean = false;

    async function handleSubmit(event: Event) {
        event.preventDefault();
        isError = false;
        try {
            await signin(username, password);
        } catch (error) {
            isError = true;
        }
    }

    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }
</script>

<Card class="w-25 mx-auto my-auto">
  <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{$_("login_to_members")}</h5>
  <div>
    <form onsubmit={handleSubmit}>
      <div>
        <Label for="username">{$_("username")}</Label>
        <Input
                class={isError ? "border-danger" : ""}
                type="text"
                name="username"
                bind:value={username}
                required
        />
      </div>
      <div>
        <Label for="password">{$_("password")}</Label>
        <div class="input-group">
          <Input
                  class={isError ? "border-danger" : ""}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  bind:value={password}
                  minlength={8}
                  maxlength={24}
                  required
          />
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span class="input-group-text" onclick={togglePasswordVisibility} style="cursor: pointer;" aria-controls="password">
            {#if showPassword}
              <EyeSolid />
            {:else}
              <EyeSlashSolid />
            {/if}
          </span>
        </div>
      </div>
      {#if isError}
        <p class="text-danger">Wrong credentials!</p>
      {/if}
      <div class="w-100 d-flex align-items-end">
        <Button type="submit" color="primary" class="ms-auto">{$_("login")}</Button>
      </div>
    </form>
  </div>
</Card>

<style>
    .input-group {
        display: flex;
        align-items: center;
    }
    .input-group-text {
        background: none;
        border: none;
    }
</style>