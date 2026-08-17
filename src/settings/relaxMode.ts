export interface RelaxModeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "adukes-town:settings:relax-mode";

// 1.5x reads as genuinely generous without trivializing the level's
// difficulty curve entirely — it turns a tight 20-move level into a
// comfortable 30-move one instead of an unlimited-moves freebie.
const RELAX_MOVE_MULTIPLIER = 1.5;

export function isRelaxModeEnabled(storage: RelaxModeStorage = localStorage): boolean {
  return storage.getItem(STORAGE_KEY) === "true";
}

export function setRelaxModeEnabled(
  enabled: boolean,
  storage: RelaxModeStorage = localStorage,
): void {
  storage.setItem(STORAGE_KEY, String(enabled));
}

export function applyRelaxMode(moveLimit: number, enabled: boolean): number {
  return enabled ? Math.ceil(moveLimit * RELAX_MOVE_MULTIPLIER) : moveLimit;
}
