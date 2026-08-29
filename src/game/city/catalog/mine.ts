import { mulberry32 } from "@/game/city/catalog/orders";

// The mine (Phase 6). Each dig costs one pick (earned from match-3 wins,
// the daily bonus, or bought with coins) and drops a deterministic haul of
// raw building materials the deeper you go, with an occasional gem (→
// tokens) or a bonus pick. Loot is a pure function of depth so offline /
// cross-device play is identical.

export const MINE_UNLOCK_LEVEL = 8;

// Coins per pick when buying them from the market.
export const PICK_PRICE = 35;
export const STARTING_PICKS = 5;

export interface MineHaul {
  // material item id → qty (mat_stone / mat_ore / mat_coal / mat_gem)
  materials: Record<string, number>;
  // gems convert straight to tokens
  tokens: number;
  // sometimes a dig turns up another pick
  bonusPicks: number;
  xp: number;
}

const COMMON = ["mat_stone", "mat_ore", "mat_coal"];

export function mineHaul(depth: number): MineHaul {
  const rand = mulberry32((depth + 1) * 0x9e3779b1);
  const materials: Record<string, number> = {};
  // 2 distinct common materials, quantity trends up slightly with depth
  const shuffled = [...COMMON].sort(() => rand() - 0.5).slice(0, 2);
  for (const id of shuffled) {
    materials[id] = 1 + Math.floor(rand() * 3) + Math.floor(depth / 10);
  }
  const gemRoll = rand();
  let tokens = 0;
  if (gemRoll < 0.12) {
    materials.mat_gem = 1;
    tokens = 1;
  }
  const bonusPicks = rand() < 0.18 ? 1 : 0;
  return { materials, tokens, bonusPicks, xp: 4 + Math.floor(depth / 5) };
}
