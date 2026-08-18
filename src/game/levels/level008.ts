import type { LevelDef } from "@/game/levels/types";

export const level008: LevelDef = {
  id: "level008",
  name: "Garden Party",
  width: 8,
  height: 9,
  colorCount: 5,
  moveLimit: 26,
  goal: { targets: { Red: 14, Green: 14 } },
};
