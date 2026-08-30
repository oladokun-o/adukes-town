// PWA install helpers. Chrome/Android fires `beforeinstallprompt` (once,
// early) — we hold onto it so an in-app button can trigger the real prompt.
// iOS has no equivalent; the install gate shows Add-to-Home-Screen steps
// instead.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

export function initInstallCapture(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
  });
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

export function wasInstalled(): boolean {
  return installed;
}

// Fires the browser's native install prompt. Returns true if the user
// accepted. Safe to call when there's no prompt (returns false).
export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted";
}

export function isStandalone(): boolean {
  return (
    window.matchMedia(
      "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)",
    ).matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac; disambiguate by touch support.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
