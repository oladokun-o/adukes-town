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

// Seed → crop pairs. Kept adjacent so the numbers stay easy to eyeball
// against crops.ts (seedCost there, basePrice here).
interface CropItemSpec {
  crop: string;
  name: string;
  icon: string;
  cropPrice: number;
}

const CROP_ITEMS: CropItemSpec[] = [
  { crop: "wheat", name: "Wheat", icon: "🌾", cropPrice: 2 },
  { crop: "corn", name: "Corn", icon: "🌽", cropPrice: 4 },
  { crop: "carrot", name: "Carrot", icon: "🥕", cropPrice: 7 },
  { crop: "sugarcane", name: "Sugarcane", icon: "🎋", cropPrice: 12 },
  { crop: "cotton", name: "Cotton", icon: "☁️", cropPrice: 22 },
  { crop: "strawberry", name: "Strawberry", icon: "🍓", cropPrice: 32 },
  { crop: "tomato", name: "Tomato", icon: "🍅", cropPrice: 45 },
  { crop: "potato", name: "Potato", icon: "🥔", cropPrice: 60 },
  { crop: "pumpkin", name: "Pumpkin", icon: "🎃", cropPrice: 110 },
  { crop: "cacao", name: "Cacao", icon: "🫘", cropPrice: 190 },
];

function buildItems(): Record<ItemId, ItemDef> {
  const items: Record<ItemId, ItemDef> = {
    good_bread: { id: "good_bread", name: "Bread", kind: "good", icon: "🍞", basePrice: 12 },
  };
  for (const { crop, name, icon, cropPrice } of CROP_ITEMS) {
    items[`seed_${crop}`] = {
      id: `seed_${crop}`,
      name: `${name} Seeds`,
      kind: "seed",
      icon: "🌱",
      basePrice: Math.max(1, Math.round(cropPrice / 3)),
    };
    items[`crop_${crop}`] = {
      id: `crop_${crop}`,
      name,
      kind: "crop",
      icon,
      basePrice: cropPrice,
    };
  }
  return items;
}

export const ITEMS: Record<ItemId, ItemDef> = buildItems();
