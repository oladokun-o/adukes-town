// The item catalog — every distinct thing that can sit in the barn: seeds,
// raw crops, and processed goods. Engine-agnostic static data, same shape as
// src/game/levels/. Content grows here (data), not in new code paths.

export type ItemId = string;

export type ItemKind = "seed" | "crop" | "good";

export interface ItemDef {
  id: ItemId;
  name: string;
  kind: ItemKind;
  icon?: string;
  // Reference value used to derive order payouts and market prices. Tuned by
  // playtesting once there's a real economy to feel.
  basePrice: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  seed_wheat: { id: "seed_wheat", name: "Wheat Seeds", kind: "seed", icon: "🌱", basePrice: 1 },
  crop_wheat: { id: "crop_wheat", name: "Wheat", kind: "crop", icon: "🌾", basePrice: 2 },
  good_bread: { id: "good_bread", name: "Bread", kind: "good", icon: "🍞", basePrice: 12 },
};
