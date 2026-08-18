import type { LevelDef } from "@/game/levels/types";

export const level009: LevelDef = {
  id: "level009",
  name: "Color Carnival",
  width: 8,
  height: 8,
  colorCount: 5,
  moveLimit: 20,
  goal: { targets: { Red: 8, Blue: 8, Yellow: 8, Purple: 8 } },
};
