import { getCityState, storeCityState } from "@/game/city/cityState";
import { levels } from "@/game/levels";
import { getStoredProgress, storeProgress } from "@/game/levels/progress";
import { migrateSaveBundle } from "@/save/migrate";
import {
  isSaveBundle,
  SCHEMA_VERSION,
  type AnySaveBundle,
  type LevelProgress,
  type SaveBundle,
} from "@/save/saveBundleSchema";
import { isRelaxModeEnabled, setRelaxModeEnabled } from "@/settings/relaxMode";

export type { SaveBundle };

// All reads here are synchronous, off the same in-memory caches the game
// already reads from — export never touches IndexedDB directly.
export function exportSave(): SaveBundle {
  const progress: Record<string, LevelProgress> = {};
  for (const level of levels) {
    const levelProgress = getStoredProgress(level.id);
    if (Object.keys(levelProgress).length > 0) progress[level.id] = levelProgress;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    progress,
    relaxMode: isRelaxModeEnabled(),
    city: getCityState(),
  };
}

export function exportSaveJson(): string {
  return JSON.stringify(exportSave(), null, 2);
}

// Writes through storeProgress/setRelaxModeEnabled/storeCityState, so each
// piece's existing write-through path (in-memory cache + idb, plus the city
// store's change listeners) handles the restore the same way a live change
// would.
export async function importSave(bundle: AnySaveBundle): Promise<void> {
  if (bundle.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`Unsupported save file version: ${bundle.schemaVersion}`);
  }
  // Older bundles are migrated forward, not rejected — a save from an
  // earlier version of the app must still restore.
  const migrated = migrateSaveBundle(bundle);

  await Promise.all([
    ...Object.entries(migrated.progress).map(([levelId, levelProgress]) =>
      storeProgress(levelId, levelProgress),
    ),
    setRelaxModeEnabled(migrated.relaxMode),
    storeCityState(migrated.city),
  ]);
}

export async function importSaveJson(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That doesn't look like a valid save file (not valid JSON).");
  }

  if (!isSaveBundle(parsed)) {
    throw new Error("That doesn't look like a valid Aduke's Town save file.");
  }

  await importSave(parsed);
}
