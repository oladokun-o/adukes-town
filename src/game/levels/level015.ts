import type { LevelDef } from "@/game/levels/types";

export const level015: LevelDef = {
  id: "level015",
  name: "Grand Finale",
  width: 9,
  height: 8,
  colorCount: 5,
  moveLimit: 30,
  goal: { targets: { Red: 12, Blue: 12, Green: 12, Yellow: 12, Purple: 12 } },
};
