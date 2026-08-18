import type { LevelDef } from "@/game/levels/types";

export const level006: LevelDef = {
  id: "level006",
  name: "Blossom Rush",
  width: 8,
  height: 8,
  colorCount: 5,
  moveLimit: 24,
  goal: { targets: { Blue: 10, Yellow: 10, Green: 10 } },
};
