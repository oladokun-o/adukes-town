import type { ItemId } from "@/game/city/catalog";
import type { CityState } from "@/game/city/types";

// The barn is a single global capacity cap over the whole inventory map —
// Township's central constraint. Every item counts as 1 unit regardless of
// type. Capacity itself is enforced in the actions (an inventory gain that
// would overflow is a no-op), not here; these are just the pure helpers.

export type Inventory = Record<ItemId, number>;

export function barnUsed(inv: Inventory): number {
  let sum = 0;
  for (const id in inv) sum += inv[id];
  return sum;
}

export function barnFree(state: CityState): number {
  return Math.max(0, state.barnCapacity - barnUsed(state.inventory));
}

export function addItems(inv: Inventory, id: ItemId, qty: number): Inventory {
  if (qty <= 0) return inv;
  return { ...inv, [id]: (inv[id] ?? 0) + qty };
}

// Clamps at 0 and deletes the key when it hits 0, so barnUsed and equality
// checks stay clean.
export function removeItems(inv: Inventory, id: ItemId, qty: number): Inventory {
  if (qty <= 0) return inv;
  const next = { ...inv };
  const remaining = (next[id] ?? 0) - qty;
  if (remaining > 0) next[id] = remaining;
  else delete next[id];
  return next;
}

export function hasItems(inv: Inventory, need: Record<ItemId, number>): boolean {
  for (const id in need) {
    if ((inv[id] ?? 0) < need[id]) return false;
  }
  return true;
}
