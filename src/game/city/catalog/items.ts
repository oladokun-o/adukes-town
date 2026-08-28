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

// Processed goods (factory outputs, incl. intermediates like flour that feed
// other factories). Kept as a flat list — the chain structure lives in
// factories.ts recipes.
interface GoodSpec {
  id: string;
  name: string;
  icon: string;
  price: number;
}

const GOODS: GoodSpec[] = [
  { id: "flour", name: "Flour", icon: "🌾", price: 7 },
  { id: "bread", name: "Bread", icon: "🍞", price: 20 },
  { id: "cornbread", name: "Cornbread", icon: "🍞", price: 34 },
  { id: "feed", name: "Animal Feed", icon: "🌰", price: 9 },
  { id: "sugar", name: "Sugar", icon: "🍥", price: 28 },
  { id: "cake", name: "Cake", icon: "🍰", price: 90 },
  { id: "juice", name: "Berry Juice", icon: "🧃", price: 72 },
  { id: "jam", name: "Strawberry Jam", icon: "🫙", price: 130 },
  { id: "thread", name: "Thread", icon: "🧵", price: 48 },
  { id: "fabric", name: "Fabric", icon: "🧶", price: 110 },
  { id: "sunhat", name: "Sun Hat", icon: "👒", price: 240 },
  { id: "tomato_sauce", name: "Tomato Sauce", icon: "🥫", price: 95 },
  { id: "veggie_soup", name: "Veggie Soup", icon: "🍲", price: 150 },
  { id: "chocolate", name: "Chocolate", icon: "🍫", price: 300 },
  { id: "choc_cake", name: "Chocolate Cake", icon: "🎂", price: 520 },
  // Animal produce (Phase 3) + what factories make from it
  { id: "egg", name: "Eggs", icon: "🥚", price: 14 },
  { id: "milk", name: "Milk", icon: "🥛", price: 20 },
  { id: "wool", name: "Wool", icon: "🧼", price: 30 },
  { id: "butter", name: "Butter", icon: "🧈", price: 55 },
  { id: "cheese", name: "Cheese", icon: "🧀", price: 130 },
  { id: "cookies", name: "Cookies", icon: "🍪", price: 60 },
  { id: "yarn", name: "Yarn", icon: "🧶", price: 80 },
  { id: "sweater", name: "Sweater", icon: "🧥", price: 260 },
];

function buildItems(): Record<ItemId, ItemDef> {
  const items: Record<ItemId, ItemDef> = {};
  for (const g of GOODS) {
    items[`good_${g.id}`] = {
      id: `good_${g.id}`,
      name: g.name,
      kind: "good",
      icon: g.icon,
      basePrice: g.price,
    };
  }
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
