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
  /* Onboarding is a standalone full-screen view — it owns its own backdrop
     rather than relying on #city-app's (that's now a transparent HUD
     overlay over the town canvas, see styles.css). */
  .onboarding {
    position: fixed;
    inset: 0;
    overflow-y: auto;
    /* pointer-events is inherited — #city-app (this component's mount
       parent, see styles.css) is now pointer-events: none by default, so
       this needs to explicitly opt back in or the whole form would be
       unclickable. */
    pointer-events: auto;
    background: linear-gradient(to bottom, var(--sky) 0%, var(--sky) 35%, var(--grass) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.25rem;
    max-width: 24rem;
    margin: 0 auto;
    padding: 3rem 1rem;
    box-sizing: border-box;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--ink);
    text-align: center;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .mode-toggle button {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.5rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--panel);
    cursor: pointer;
  }

  .mode-toggle button.active {
    background: var(--bloom);
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
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
  }

  input {
    border: none;
    border-radius: 0.6rem;
    padding: 0.55rem 0.7rem;
    font-family: var(--font-body);
    font-size: 0.95rem;
    background: var(--panel);
    color: var(--ink);
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(58, 43, 34, 0.7);
  }

  .error {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #c23b3b;
  }

  button[type="submit"] {
    border: none;
    border-radius: 999px;
    padding: 0.85rem 1rem;
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  button[type="submit"]:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
