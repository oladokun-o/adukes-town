<script lang="ts">
  import { createAccount, loginWithAccount } from "@/save/account";
  import { isValidUsername } from "@/save/accountAuth";
  import { pullFromCloud } from "@/save/cloudSync";

  let { onComplete }: { onComplete: () => void } = $props();

  let mode: "create" | "login" = $state("create");
  let username = $state("");
  let code = $state("");
  let confirmCode = $state("");
  let submitting = $state(false);
  let error = $state("");

  function switchMode(next: "create" | "login"): void {
    mode = next;
    error = "";
  }

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!isValidUsername(username)) {
      error = "Username must be 2-32 characters: letters, numbers, - or _.";
      return;
    }
    if (!code) {
      error = "Enter a code.";
      return;
    }
    if (mode === "create" && code !== confirmCode) {
      error = "Codes don't match.";
      return;
    }

    submitting = true;
    error = "";
    try {
      const result =
        mode === "create"
          ? await createAccount(username, code)
          : await loginWithAccount(username, code);

      if (!result.ok) {
        error = result.error ?? "Something went wrong.";
        return;
      }

      if (mode === "login") {
        try {
          await pullFromCloud();
        } catch (err) {
          // Account is verified either way — a failed restore (nothing
          // saved yet, or a transient network issue) shouldn't block her
          // from playing. She can retry from the tucked-away Backup menu.
          console.warn("Aduke's Town: couldn't restore from the cloud during onboarding.", err);
        }
      }

      onComplete();
    } finally {
      submitting = false;
    }
  }
</script>

<div class="onboarding">
  <h1>Welcome to Aduke's Town</h1>

  <div class="mode-toggle" role="tablist">
    <button type="button" class:active={mode === "create"} onclick={() => switchMode("create")}>
      New player
    </button>
    <button type="button" class:active={mode === "login"} onclick={() => switchMode("login")}>
      I already have an account
    </button>
  </div>

  <form onsubmit={submit}>
    <label>
      Username
      <input type="text" bind:value={username} autocomplete="username" />
    </label>

    <label>
      {mode === "create" ? "Choose a code" : "Your code"}
      <input
        type="password"
        bind:value={code}
        autocomplete={mode === "create" ? "new-password" : "current-password"}
      />
    </label>

    {#if mode === "create"}
      <label>
        Confirm code
        <input type="password" bind:value={confirmCode} autocomplete="new-password" />
      </label>
      <p class="hint">Remember this — you'll need it to restore your save on another device.</p>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button type="submit" disabled={submitting}>
      {submitting ? "One moment…" : mode === "create" ? "Start playing" : "Restore my save"}
    </button>
  </form>
</div>

<style>
  .onboarding {
    max-width: 24rem;
    margin: 3rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    text-align: center;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .mode-toggle button {
    flex: 1;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f5f5f7;
    background: transparent;
    cursor: pointer;
  }

  .mode-toggle button.active {
    background: #ff8fb3;
    color: #1a1a2e;
    border-color: #ff8fb3;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
  }

  input {
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 0.5rem;
    padding: 0.5rem 0.65rem;
    font-size: 0.95rem;
    background: rgba(255, 255, 255, 0.06);
    color: #f5f5f7;
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(245, 245, 247, 0.7);
  }

  .error {
    margin: 0;
    font-size: 0.85rem;
    color: #ff8f8f;
  }

  button[type="submit"] {
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a2e;
    background: #ff8fb3;
    cursor: pointer;
  }

  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
