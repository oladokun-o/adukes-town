// Flat base + a small bonus per unused move — rewards efficient play without
// needing any new tracked stat (movesRemaining is already tracked by
// BoardScene). Losses still pay a small flat consolation, implementing the
// "no pure-loss state" design principle at the city level too.
export const BASE_LEVEL_WIN_COINS = 15;
export const BONUS_COINS_PER_MOVE_REMAINING = 2;
export const LOSS_CONSOLATION_COINS = 3;

// XP mirrors the "no pure-loss" principle: a win advances the city level
// bar meaningfully, a loss still nudges it.
export const LEVEL_WIN_XP = 8;
export const LEVEL_LOSS_XP = 2;

export function computeLevelWinReward(movesRemaining: number): number {
  return BASE_LEVEL_WIN_COINS + movesRemaining * BONUS_COINS_PER_MOVE_REMAINING;
}
