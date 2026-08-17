import type { LevelDef } from "@/game/levels/types";

export const level002: LevelDef = {
  id: "level002",
  name: "Double Trouble",
  width: 7,
  height: 9,
  colorCount: 4,
  moveLimit: 25,
  goal: { targets: { Red: 10, Blue: 10 } },
};
