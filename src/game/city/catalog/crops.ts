import type { ItemId } from "@/game/city/catalog/items";

// Field crops. Phase 0 ships only wheat (parity with the old single-crop
// slice); Phase 1 fills this out to ~10 with distinct grow times and level
// gates. `growMs` / `yield` here are the source of truth — the old
// CROP_GROW_MS constant is gone.

export interface CropDef {
  id: string;
  name: string;
  producesItemId: ItemId;
  yield: number;
  growMs: number;
  seedItemId: ItemId;
  seedCost: number;
  unlockLevel: number;
  // XP granted per harvest. Kept small — the meaningful XP comes from
  // factories and orders.
  xp: number;
  sprite?: string;
}

export const CROPS: Record<string, CropDef> = {
  wheat: {
    id: "wheat",
    name: "Wheat",
    producesItemId: "crop_wheat",
    yield: 1,
    growMs: 60_000,
    seedItemId: "seed_wheat",
    seedCost: 1,
    unlockLevel: 1,
    xp: 1,
  },
};
