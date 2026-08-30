<script lang="ts">
  import { onMount } from "svelte";
  import { hasInstallPrompt, isIOS, isStandalone, triggerInstall } from "@/pwa/installPrompt";
  import { dismissInstallGate } from "@/settings/installGate";

  let { onDone }: { onDone: () => void } = $props();

  // Decided once on mount — the browser won't change platform mid-screen.
  const ios = isIOS();
  const canPrompt = hasInstallPrompt();
  let installing = $state(false);
  let promptDismissed = $state(false);

  function finish(): void {
    onDone();
  }

  function continueInBrowser(): void {
    void dismissInstallGate();
    finish();
  }

  async function install(): Promise<void> {
    installing = true;
    const accepted = await triggerInstall();
    installing = false;
    if (accepted) {
      // `appinstalled` will also fire; either way the browser tab keeps
      // running until she opens the installed icon, so hand off to the game.
      finish();
    } else {
      promptDismissed = true;
    }
  }

  onMount(() => {
    if (isStandalone()) {
      finish();
      return;
    }
    const onInstalled = (): void => finish();
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  });
</script>

<div class="gate">
  <div class="inner">
    <span class="mark">🏡</span>
    <h1>Add Aduke's Town<br />to your Home Screen</h1>
    <p class="why">
      It opens full screen, loads instantly, and keeps your town safe from the browser clearing its
      storage.
    </p>

    {#if canPrompt}
      <button type="button" class="primary" onclick={install} disabled={installing}>
        {installing ? "Opening…" : "Install app"}
      </button>
      {#if promptDismissed}
        <p class="note">No rush — you can install any time from your browser menu.</p>
      {/if}
    {:else if ios}
      <ol class="steps">
        <li>
          Tap the <span class="ios-share" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M12 3.3 8.3 7l1.4 1.4L11 7.1V15h2V7.1l1.3 1.3L15.7 7 12 3.3Z"
              />
              <path
                fill="currentColor"
                d="M6 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1v2h1v7H5v-7h1v-2Z"
              />
            </svg>
          </span> Share button in Safari's toolbar
        </li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
        <li>Tap <strong>Add</strong>, then open Aduke's Town from your Home Screen</li>
      </ol>
    {:else}
      <p class="steps-fallback">
        Open your browser's menu and choose <strong>Add to Home Screen</strong> or
        <strong>Install</strong>, then launch Aduke's Town from the new icon.
      </p>
    {/if}

    <button type="button" class="ghost" onclick={continueInBrowser}> Continue in browser </button>
  </div>
</div>

<style>
  .gate {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(1.25rem + env(safe-area-inset-top)) calc(1.25rem + env(safe-area-inset-right))
      calc(1.25rem + env(safe-area-inset-bottom)) calc(1.25rem + env(safe-area-inset-left));
    overflow-y: auto;
    background:
      radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, 0.3), transparent 60%),
      linear-gradient(160deg, #ffe1ea, #ffe9c9 55%, #fff6e9);
  }

  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    max-width: 22rem;
    text-align: center;
    color: var(--ink);
  }

  .mark {
    font-size: 2.4rem;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.3rem, 5.5vw, 1.9rem);
    line-height: 1.15;
  }

  .why {
    margin: 0;
    font-family: var(--font-body);
    font-size: clamp(0.8rem, 3.4vw, 0.95rem);
    color: rgba(58, 43, 34, 0.72);
  }

  .primary {
    margin-top: 0.4rem;
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.6rem;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(100deg, #ff5c85, #ff9a3c);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.18);
    cursor: pointer;
  }

  .primary:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .steps {
    margin: 0.4rem 0 0;
    padding-left: 1.2rem;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: var(--font-body);
    font-size: clamp(0.82rem, 3.4vw, 0.95rem);
    color: rgba(58, 43, 34, 0.85);
  }

  .steps-fallback {
    margin: 0.4rem 0 0;
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: rgba(58, 43, 34, 0.85);
  }

  .ios-share {
    display: inline-flex;
    vertical-align: middle;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.4rem;
    background: rgba(0, 122, 255, 0.12);
    color: #007aff;
  }

  .note {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.8rem;
    color: rgba(58, 43, 34, 0.6);
  }

  .ghost {
    margin-top: 0.6rem;
    border: none;
    background: none;
    padding: 0.4rem 0.6rem;
    font-family: var(--font-body);
    font-size: 0.82rem;
    color: rgba(58, 43, 34, 0.55);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
