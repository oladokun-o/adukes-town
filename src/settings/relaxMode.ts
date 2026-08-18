import { idbGet, idbSet } from "@/save/db";

const IDB_KEY = "settings:relax-mode";

// 1.5x reads as genuinely generous without trivializing the level's
// difficulty curve entirely — it turns a tight 20-move level into a
// comfortable 30-move one instead of an unlimited-moves freebie.
const RELAX_MOVE_MULTIPLIER = 1.5;

// Read-through cache, same reasoning as levels/progress.ts: the HUD reads
// this synchronously, IndexedDB can't be. Hydrated once at app bootstrap
// (see loadRelaxModeFromDb).
let relaxModeCache = false;

export function isRelaxModeEnabled(): boolean {
  return relaxModeCache;
}

export async function setRelaxModeEnabled(enabled: boolean): Promise<void> {
  relaxModeCache = enabled;
  await idbSet(IDB_KEY, enabled);
}

export function applyRelaxMode(moveLimit: number, enabled: boolean): number {
  return enabled ? Math.ceil(moveLimit * RELAX_MOVE_MULTIPLIER) : moveLimit;
}

// Call once at app bootstrap, before any scene reads relax mode.
export async function loadRelaxModeFromDb(): Promise<void> {
  const stored = await idbGet<boolean>(IDB_KEY);
  if (stored !== undefined) relaxModeCache = stored;
}
