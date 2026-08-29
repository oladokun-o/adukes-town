import { getItem, mulberry32 } from "@/game/city/catalog";
import { barnFree } from "@/game/city/barn";
import type { CityState } from "@/game/city/types";

// What a match-3 result pours into the city. Phase 7 makes this richer than
// flat coins: a win also drops picks, booster charges, and — the point — a
// couple of units of a GOOD the city currently needs, so the two loops feed
// each other. A loss still pays a non-zero consolation bundle (coins + xp),
// implementing "no pure-loss state" at the city level.

export const BASE_WIN_COINS = 15;
export const COINS_PER_MOVE_LEFT = 2;
export const WIN_XP = 8;
export const WIN_PICKS = 1;
export const WIN_BOOSTER_CHARGES = 1;
export const WIN_GOODS_QTY = 2;

export const LOSS_COINS = 3;
export const LOSS_XP = 2;

export interface MatchRewardBundle {
  coins: number;
  xp: number;
  picks: number;
  boosterCharges: number;
  // itemId → qty; may be empty (nothing the city wants is producible yet,
  // or the barn is full).
  goods: Record<string, number>;
}

// Every good the open helicopter board / train / plane / harbor manifests
// are currently asking for. Sorted for deterministic selection.
export function wantedItems(state: CityState): string[] {
  const ids = new Set<string>();
  const add = (requires: Record<string, number>): void => {
    for (const id of Object.keys(requires)) {
      if (getItem(id)?.kind === "good") ids.add(id);
    }
  };
  for (const order of state.orders) add(order.requires);
  for (const wagon of state.train.wagons) add(wagon.requires);
  add(state.plane.manifest.requires);
  add(state.harbor.manifest.requires);
  return [...ids].sort();
}

function pickWantedGood(state: CityState, seed: number): string | null {
  const wanted = wantedItems(state);
  if (wanted.length === 0) return null;
  return wanted[Math.floor(mulberry32(seed)() * wanted.length)];
}

export function matchWinBundle(
  state: CityState,
  movesRemaining: number,
  seed: number,
): MatchRewardBundle {
  const goods: Record<string, number> = {};
  const good = pickWantedGood(state, seed);
  if (good && barnFree(state) >= WIN_GOODS_QTY) {
    goods[good] = WIN_GOODS_QTY;
  }
  return {
    coins: BASE_WIN_COINS + Math.max(0, movesRemaining) * COINS_PER_MOVE_LEFT,
    xp: WIN_XP,
    picks: WIN_PICKS,
    boosterCharges: WIN_BOOSTER_CHARGES,
    goods,
  };
}

export function matchLossBundle(): MatchRewardBundle {
  return { coins: LOSS_COINS, xp: LOSS_XP, picks: 0, boosterCharges: 0, goods: {} };
}
