import type { LevelDef } from "@/game/levels/types";

export const level001: LevelDef = {
  id: "level001",
  name: "First Bloom",
  width: 8,
  height: 8,
  colorCount: 5,
  moveLimit: 20,
  goal: { targets: { Red: 15 } },
};
