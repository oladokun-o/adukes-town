<script lang="ts">
  import { dismissInstallBanner, isInstallBannerDismissed } from "@/settings/installBanner";

  // iOS has no `beforeinstallprompt` — there's no feature-detectable way to
  // know "this is Safari on iOS with no install prompt available", so a UA
  // check is the only option here. See docs/reference/03-technical-architecture.md §3.1.
  function isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isStandalone(): boolean {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }

  let dismissed = $state(isInstallBannerDismissed());
  let visible = $derived(isIOS() && !isStandalone() && !dismissed);

  function dismiss(): void {
    dismissed = true;
    dismissInstallBanner().catch((err: unknown) => {
      console.warn("Aduke's Town: couldn't save install-banner dismissal.", err);
    });
  }
</script>

{#if visible}
  <div class="banner">
    <p>
      Install Aduke's Town: tap <strong>Share</strong> then
      <strong>Add to Home Screen</strong> — keeps your progress safe from Safari's storage cleanup.
    </p>
    <button type="button" onclick={dismiss}>Got it</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: 0.75rem;
    background: rgba(255, 143, 179, 0.15);
    border: 1px solid rgba(255, 143, 179, 0.4);
    padding: 0.75rem;
  }

  p {
    margin: 0;
    flex: 1;
    font-size: 0.85rem;
  }

  button {
    flex-shrink: 0;
    border: none;
    border-radius: 0.5rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a2e;
    background: #ff8fb3;
    cursor: pointer;
  }
</style>
