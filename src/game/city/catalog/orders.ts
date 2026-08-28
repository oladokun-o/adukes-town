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
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  const rand = mulberry32(seed);
  const pool = orderableItemsAt(level);

  // Fisher–Yates with the seeded PRNG.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const typeCount = Math.max(
    1,
    Math.min(pool.length, 1 + Math.floor(rand() * MAX_ORDER_ITEM_TYPES)),
  );
  const chosen = shuffled.slice(0, typeCount);

  const requires: Record<ItemId, number> = {};
  let value = 0;
  let totalQty = 0;
  for (const id of chosen) {
    const qty = 1 + Math.floor(rand() * MAX_ORDER_ITEM_QTY);
    requires[id] = qty;
    value += (ITEMS[id]?.basePrice ?? 0) * qty;
    totalQty += qty;
  }

  return {
    requires,
    rewardCoins: Math.max(1, Math.ceil(value * ORDER_COIN_MARGIN)),
    rewardXp: Math.max(1, totalQty * ORDER_XP_PER_ITEM),
  };
}
