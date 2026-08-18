import type { LevelDef } from "@/game/levels/types";

export const level012: LevelDef = {
  id: "level012",
  name: "Petal Storm",
  width: 6,
  height: 7,
  colorCount: 3,
  moveLimit: 12,
  goal: { targets: { Green: 18 } },
};
