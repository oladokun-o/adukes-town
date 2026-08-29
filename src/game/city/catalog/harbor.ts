import { mulberry32, orderableItemsAt, pickBundle } from "@/game/city/catalog/orders";
import type { ItemId } from "@/game/city/catalog/items";
import type { Bundle } from "@/game/city/catalog/transport";

// The harbor (Phase 6). A fourth, slowest trade lane: load one large
// manifest onto a ship, it sails for a long trip, and returns with coins,
// tokens, and gems (mine-grade materials) — the premium-currency income
// tap that isn't the mine. Same pure (seed, level) generation as the
// transport trio.

export const HARBOR_UNLOCK_LEVEL = 12;
export const SHIP_TRIP_MS = 4 * 60 * 60_000; // 4 hours

export function generateShipManifest(seed: number, level: number): Bundle {
  const { requires } = pickBundle(mulberry32(seed), orderableItemsAt(level), {
    minTypes: 5,
    maxTypes: 7,
    minQty: 6,
    maxQty: 12,
  });
  return { requires };
}

export interface ShipReward {
  materials: Record<ItemId, number>;
  coins: number;
  tokens: number;
  xp: number;
}

export function shipReward(seed: number, level: number): ShipReward {
  const rand = mulberry32(seed ^ 0x7e1a);
  return {
    materials: { mat_gem: 1 + Math.floor(rand() * 2) },
    coins: 500 + level * 60,
    tokens: 2 + Math.floor(rand() * 2),
    xp: 120 + level * 10,
  };
}
