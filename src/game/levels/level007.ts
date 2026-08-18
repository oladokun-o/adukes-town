import type { LevelDef } from "@/game/levels/types";

export const level007: LevelDef = {
  id: "level007",
  name: "Golden Hour",
  width: 7,
  height: 7,
  colorCount: 4,
  moveLimit: 16,
  goal: { targets: { Purple: 18 } },
};
