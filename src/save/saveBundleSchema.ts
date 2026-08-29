import type { PieceType } from "@/game/board/types";
import type { CityState } from "@/game/city/types";

// Bumped when the shape of SaveBundle changes in a way an older export
// can't be read as-is. v1→v2: data-driven economy; v2→v3: per-factory
// production queue; v3→v4: animal pens; v4→v5: transport trio (heli board,
// train, plane) + materials + barn upgrades; v5→v6: town layer (buildings +
// townExpansions); v6→v7: deep economy (tokens, stats, achievements, daily,
// balloon, mine, zoo, harbor); v7→v8: match-3 lives + booster charges; v8→v9: narrative (story: NPC relationships, festivals, setback).
// Migration lives in src/save/migrate.ts; every boundary that accepts a
// bundle (backup import, cloud pull, api/save) migrates on read rather than
// rejecting old files.
export const SCHEMA_VERSION = 9;

export type LevelProgress = Partial<Record<PieceType, number>>;

// --- v1 (frozen — input type for the migrator only) -----------------------

export interface CityStateV1 {
  coins: number;
  plots: { id: string; unlocked: boolean; crop: { startedAt: number; readyAt: number } | null }[];
  cropInventory: number;
  factory: { batch: { startedAt: number; readyAt: number } | null };
  goodsInventory: number;
  lastPlayedLevelId: string | null;
}

export interface SaveBundleV1 {
  schemaVersion: 1;
  progress: Record<string, LevelProgress>;
  relaxMode: boolean;
  city: CityStateV1;
}

// --- current (v3) -------------------------------------------------------

export interface SaveBundle {
  schemaVersion: number;
  progress: Record<string, LevelProgress>;
  relaxMode: boolean;
  city: CityState;
}

export type AnySaveBundle = SaveBundle | SaveBundleV1;

// Structural guard shared by the client (backup.ts, cloudSync.ts) and the
// cloud API (api/save.ts). Accepts any known version (1..SCHEMA_VERSION) —
// a bundle crossing either boundary is untrusted input worth checking, but
// an older version is migrated, not refused.
export function isSaveBundle(value: unknown): value is AnySaveBundle {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<SaveBundle>;
  return (
    typeof v.schemaVersion === "number" &&
    v.schemaVersion >= 1 &&
    v.schemaVersion <= SCHEMA_VERSION &&
    typeof v.progress === "object" &&
    v.progress !== null &&
    typeof v.relaxMode === "boolean" &&
    typeof v.city === "object" &&
    v.city !== null
  );
}
