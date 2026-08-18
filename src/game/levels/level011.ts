import type { LevelDef } from "@/game/levels/types";

export const level011: LevelDef = {
  id: "level011",
  name: "Town Square",
  width: 9,
  height: 9,
  colorCount: 5,
  moveLimit: 28,
  goal: { targets: { Blue: 15, Purple: 15 } },
};
