import type { LevelDef } from "@/game/levels/types";

export const level003: LevelDef = {
  id: "level003",
  name: "Petal Path",
  width: 7,
  height: 8,
  colorCount: 4,
  moveLimit: 18,
  goal: { targets: { Yellow: 16 } },
};
