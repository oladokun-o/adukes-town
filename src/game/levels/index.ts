import { level001 } from "@/game/levels/level001";
import { level002 } from "@/game/levels/level002";
import { level003 } from "@/game/levels/level003";
import { level004 } from "@/game/levels/level004";
import { level005 } from "@/game/levels/level005";
import { level006 } from "@/game/levels/level006";
import { level007 } from "@/game/levels/level007";
import { level008 } from "@/game/levels/level008";
import { level009 } from "@/game/levels/level009";
import { level010 } from "@/game/levels/level010";
import { level011 } from "@/game/levels/level011";
import { level012 } from "@/game/levels/level012";
import { level013 } from "@/game/levels/level013";
import { level014 } from "@/game/levels/level014";
import { level015 } from "@/game/levels/level015";
import type { LevelDef } from "@/game/levels/types";

export const levels: LevelDef[] = [
  level001,
  level002,
  level003,
  level004,
  level005,
  level006,
  level007,
  level008,
  level009,
  level010,
  level011,
  level012,
  level013,
  level014,
  level015,
];

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
