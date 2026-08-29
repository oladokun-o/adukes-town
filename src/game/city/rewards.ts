// Match-3 → city reward tunables. The full bundle logic (order-linked
// goods, picks, booster charges) lives in matchRewards.ts as of Phase 7;
// this module keeps the flat-coin helpers the in-board HUD (Hud.ts) shows
// as quick result text, aliased to the canonical constants so they can't
// drift.

import {
  BASE_WIN_COINS,
  COINS_PER_MOVE_LEFT,
  LOSS_COINS,
  LOSS_XP,
  WIN_XP,
} from "@/game/city/matchRewards";

export const BASE_LEVEL_WIN_COINS = BASE_WIN_COINS;
export const BONUS_COINS_PER_MOVE_REMAINING = COINS_PER_MOVE_LEFT;
export const LOSS_CONSOLATION_COINS = LOSS_COINS;
export const LEVEL_WIN_XP = WIN_XP;
export const LEVEL_LOSS_XP = LOSS_XP;

export function computeLevelWinReward(movesRemaining: number): number {
  return BASE_LEVEL_WIN_COINS + Math.max(0, movesRemaining) * BONUS_COINS_PER_MOVE_REMAINING;
}
