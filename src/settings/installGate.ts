import { idbGet, idbSet } from "@/save/db";

const IDB_KEY = "settings:install-gate-dismissed";

// Read-through cache, same shape as installBanner.ts: the gate is decided
// synchronously during boot, IndexedDB can't be. Hydrated once at app
// bootstrap (see loadInstallGateDismissedFromDb).
//
// Distinct from the install *banner* flag on purpose — the banner is an
// ongoing in-app nudge, the gate is the one-time "install me first" screen.
// Dismissing the gate ("continue in browser") shouldn't also silence the
// gentler banner.
let dismissedCache = false;

export function isInstallGateDismissed(): boolean {
  return dismissedCache;
}

export async function dismissInstallGate(): Promise<void> {
  dismissedCache = true;
  await idbSet(IDB_KEY, true);
}

// Call once at app bootstrap, before boot() reads the flag.
export async function loadInstallGateDismissedFromDb(): Promise<void> {
  const stored = await idbGet<boolean>(IDB_KEY);
  if (stored !== undefined) dismissedCache = stored;
}
