import type { LevelDef } from "@/game/levels/types";

export const level005: LevelDef = {
  id: "level005",
  name: "Sunny Row",
  width: 6,
  height: 8,
  colorCount: 3,
  moveLimit: 15,
  goal: { targets: { Red: 20 } },
};
