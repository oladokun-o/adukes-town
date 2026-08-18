import type { LevelDef } from "@/game/levels/types";

export const level013: LevelDef = {
  id: "level013",
  name: "Rainbow Row",
  width: 8,
  height: 8,
  colorCount: 5,
  moveLimit: 22,
  goal: { targets: { Red: 10, Blue: 10, Green: 10, Yellow: 10 } },
};
