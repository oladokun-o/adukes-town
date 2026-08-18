import type { LevelDef } from "@/game/levels/types";

export const level010: LevelDef = {
  id: "level010",
  name: "Harvest Time",
  width: 7,
  height: 8,
  colorCount: 4,
  moveLimit: 17,
  goal: { targets: { Green: 20 } },
};
