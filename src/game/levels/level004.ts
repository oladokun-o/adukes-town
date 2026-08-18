import type { LevelDef } from "@/game/levels/types";

export const level004: LevelDef = {
  id: "level004",
  name: "Market Basket",
  width: 8,
  height: 7,
  colorCount: 5,
  moveLimit: 22,
  goal: { targets: { Green: 12, Purple: 12 } },
};
