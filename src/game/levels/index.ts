import { level001 } from "@/game/levels/level001";
import { level002 } from "@/game/levels/level002";
import type { LevelDef } from "@/game/levels/types";

export const levels: LevelDef[] = [level001, level002];

export function getLevelById(id: string): LevelDef {
  const level = levels.find((l) => l.id === id);
  if (!level) {
    throw new Error(`getLevelById: unknown level id "${id}"`);
  }
  return level;
}

// null past the last level — callers use that to detect "all levels beaten"
// rather than wrapping around.
export function getNextLevel(id: string): LevelDef | null {
  const index = levels.findIndex((l) => l.id === id);
  if (index === -1 || index === levels.length - 1) return null;
  return levels[index + 1];
}
