import { idbGet, idbSet } from "@/save/db";

const IDB_KEY = "settings:install-banner-dismissed";

// Read-through cache, same shape as relaxMode.ts: the banner reads this
// synchronously on mount, IndexedDB can't be. Hydrated once at app
// bootstrap (see loadInstallBannerDismissedFromDb).
let dismissedCache = false;

export function isInstallBannerDismissed(): boolean {
  return dismissedCache;
}

export async function dismissInstallBanner(): Promise<void> {
  dismissedCache = true;
  await idbSet(IDB_KEY, true);
}

// Call once at app bootstrap, before anything reads the dismissed flag.
export async function loadInstallBannerDismissedFromDb(): Promise<void> {
  const stored = await idbGet<boolean>(IDB_KEY);
  if (stored !== undefined) dismissedCache = stored;
}
