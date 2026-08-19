import type { PieceType } from "@/game/board/types";
import type { CityState } from "@/game/city/types";

// Bumped only if the shape of SaveBundle changes in a way older exports
// can't be read as. There's no migration logic yet — this is the hook a
// future version bump would need, per the project's PWA-hardening docs.
export const SCHEMA_VERSION = 1;

export type LevelProgress = Partial<Record<PieceType, number>>;

export interface SaveBundle {
  schemaVersion: number;
  progress: Record<string, LevelProgress>;
  relaxMode: boolean;
  city: CityState;
}

// Shared by the client (backup.ts, validating an imported file) and the
// cloud save API function (validating a PUT body) — a save bundle crossing
// either boundary is untrusted input worth checking, not just assuming.
export function isSaveBundle(value: unknown): value is SaveBundle {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<SaveBundle>).schemaVersion === "number" &&
    typeof (value as Partial<SaveBundle>).progress === "object" &&
    typeof (value as Partial<SaveBundle>).relaxMode === "boolean" &&
    typeof (value as Partial<SaveBundle>).city === "object"
  );
}
