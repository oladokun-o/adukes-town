import { ITEMS, type ItemId } from "@/game/city/catalog/items";
import { CROPS } from "@/game/city/catalog/crops";
import { RECIPES } from "@/game/city/catalog/factories";
import { ANIMAL_PENS } from "@/game/city/catalog/animals";

// Helicopter-style orders: a small bundle of items wanted in exchange for
// coins + XP. Generation is a PURE function of (seed, level) so the same
// seed always yields the same order — the persisted OrderState only stores
// the seed plus the derived fields, and any device replays it identically.

export interface OrderSpec {
  requires: Record<ItemId, number>;
  rewardCoins: number;
  rewardXp: number;
}

// Payout = marked-up sum of the requested items' base prices.
export const ORDER_COIN_MARGIN = 1.5;
export const ORDER_XP_PER_ITEM = 2;
export const MAX_ORDER_ITEM_TYPES = 3;
export const MAX_ORDER_ITEM_QTY = 3;

// mulberry32 — tiny, fast, deterministic PRNG. Inlined so the catalog has
// no dependency surface.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shared bundle picker: choose `typeCount` distinct items from `pool` and a
// per-item quantity. Used for helicopter orders, train wagons, and plane
// manifests — they differ only in size. Returns the item→qty map plus the
// summed base-price value.
export function pickBundle(
  rand: () => number,
  pool: ItemId[],
  opts: { minTypes: number; maxTypes: number; minQty: number; maxQty: number },
): { requires: Record<ItemId, number>; value: number; totalQty: number } {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const span = opts.maxTypes - opts.minTypes + 1;
  const typeCount = Math.min(pool.length, opts.minTypes + Math.floor(rand() * span));
  const chosen = shuffled.slice(0, Math.max(1, typeCount));

  const requires: Record<ItemId, number> = {};
  let value = 0;
  let totalQty = 0;
  for (const id of chosen) {
    const qty = opts.minQty + Math.floor(rand() * (opts.maxQty - opts.minQty + 1));
    requires[id] = qty;
    value += (ITEMS[id]?.basePrice ?? 0) * qty;
    totalQty += qty;
  }
  return { requires, value, totalQty };
}

// Items an order may ask for at a given level: raw crops and processed
// goods whose producing crop/recipe is unlocked. Sorted for determinism.
export function orderableItemsAt(level: number): ItemId[] {
  const ids = new Set<ItemId>();
  for (const crop of Object.values(CROPS)) {
    if (crop.unlockLevel <= level) ids.add(crop.producesItemId);
  }
  for (const recipe of Object.values(RECIPES)) {
    if (recipe.unlockLevel <= level) ids.add(recipe.outputItemId);
  }
  for (const pen of Object.values(ANIMAL_PENS)) {
    if (pen.unlockLevel <= level) ids.add(pen.producesItemId);
  }
  return [...ids].sort();
}

export function generateOrder(seed: number, level: number): OrderSpec {
  const { requires, value, totalQty } = pickBundle(mulberry32(seed), orderableItemsAt(level), {
    minTypes: 1,
    maxTypes: MAX_ORDER_ITEM_TYPES,
    minQty: 1,
    maxQty: MAX_ORDER_ITEM_QTY,
  });
  return {
    requires,
    rewardCoins: Math.max(1, Math.ceil(value * ORDER_COIN_MARGIN)),
    rewardXp: Math.max(1, totalQty * ORDER_XP_PER_ITEM),
  };
}
