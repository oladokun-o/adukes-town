import { getCrop, getItem, PICK_PRICE } from "@/game/city/catalog";
import { addItems, barnFree, hasItems, removeItems } from "@/game/city/barn";
import type { CityState } from "@/game/city/types";

// The market is the barn's pressure valve: buy seeds to plant, sell surplus
// crops/goods for coins when storage gets tight. Same guarded-pure-transition
// contract as cityActions.ts — an invalid call returns the same state ref.

// Sell price is a fraction of base price so buy-low/sell-high isn't a
// coin fountain — selling is a relief valve, not a strategy.
export const SELL_RATE = 0.55;

export function seedPrice(cropId: string): number {
  return getCrop(cropId)?.seedCost ?? 0;
}

export function sellPrice(itemId: string): number {
  return Math.max(1, Math.floor((getItem(itemId)?.basePrice ?? 0) * SELL_RATE));
}

export function buySeed(state: CityState, cropId: string, qty: number): CityState {
  const crop = getCrop(cropId);
  if (!crop || crop.unlockLevel > state.level || qty <= 0) return state;
  const cost = crop.seedCost * qty;
  if (state.coins < cost || barnFree(state) < qty) return state;
  return {
    ...state,
    coins: state.coins - cost,
    inventory: addItems(state.inventory, crop.seedItemId, qty),
  };
}

// Mine picks are also sold here — coins in, picks in hand.
export function buyPicks(state: CityState, qty: number): CityState {
  if (qty <= 0) return state;
  const cost = PICK_PRICE * qty;
  if (state.coins < cost) return state;
  return {
    ...state,
    coins: state.coins - cost,
    mine: { ...state.mine, picks: state.mine.picks + qty },
  };
}

export function sellItem(state: CityState, itemId: string, qty: number): CityState {
  const item = getItem(itemId);
  if (!item || qty <= 0 || !hasItems(state.inventory, { [itemId]: qty })) return state;
  return {
    ...state,
    coins: state.coins + sellPrice(itemId) * qty,
    inventory: removeItems(state.inventory, itemId, qty),
  };
}
