import type { ItemId } from "@/game/city/catalog/items";

// Factories and their recipes. A factory is a placed building; a recipe is
// one input→output conversion it can run. Recipes form chains: wheat →
// (Mill) flour → (Bakery) bread, and deeper — cake needs flour + sugar,
// chocolate cake needs cake + chocolate. Grow/produce times and unlock
// levels are the balance knobs (Phase 9 tuning pass).

export interface FactoryDef {
  id: string;
  name: string;
  unlockLevel: number;
  sprite?: string;
}

export interface RecipeDef {
  id: string;
  factoryId: string;
  name: string;
  inputs: Record<ItemId, number>;
  outputItemId: ItemId;
  outputQty: number;
  produceMs: number;
  unlockLevel: number;
  xp: number;
}

const M = 60_000;

interface FSpec {
  id: string;
  name: string;
  unlockLevel: number;
}

const FACTORY_SPECS: FSpec[] = [
  { id: "mill", name: "Mill", unlockLevel: 1 },
  { id: "bakery", name: "Bakery", unlockLevel: 1 },
  { id: "feed_mill", name: "Feed Mill", unlockLevel: 2 },
  { id: "sugar_mill", name: "Sugar Mill", unlockLevel: 4 },
  { id: "textile_mill", name: "Textile Mill", unlockLevel: 5 },
  { id: "juice_press", name: "Juice Press", unlockLevel: 6 },
  { id: "tailor", name: "Tailor Shop", unlockLevel: 6 },
  { id: "cannery", name: "Cannery", unlockLevel: 7 },
  { id: "kitchen", name: "Kitchen", unlockLevel: 8 },
  { id: "confectionery", name: "Confectionery", unlockLevel: 9 },
  { id: "chocolate_maker", name: "Chocolate Maker", unlockLevel: 12 },
];

export const FACTORIES: Record<string, FactoryDef> = Object.fromEntries(
  FACTORY_SPECS.map((f) => [f.id, { ...f } satisfies FactoryDef]),
);

interface RSpec {
  id: string;
  factoryId: string;
  name: string;
  inputs: Record<string, number>;
  out: string;
  outQty?: number;
  minutes: number;
  unlockLevel?: number;
  xp: number;
}

const RECIPE_SPECS: RSpec[] = [
  // Mill
  {
    id: "flour",
    factoryId: "mill",
    name: "Flour",
    inputs: { crop_wheat: 2 },
    out: "good_flour",
    minutes: 3,
    xp: 3,
  },
  // Bakery
  {
    id: "bread",
    factoryId: "bakery",
    name: "Bread",
    inputs: { good_flour: 2 },
    out: "good_bread",
    minutes: 5,
    xp: 6,
  },
  {
    id: "cornbread",
    factoryId: "bakery",
    name: "Cornbread",
    inputs: { good_flour: 1, crop_corn: 2 },
    out: "good_cornbread",
    minutes: 9,
    unlockLevel: 3,
    xp: 11,
  },
  // Feed Mill
  {
    id: "feed",
    factoryId: "feed_mill",
    name: "Animal Feed",
    inputs: { crop_wheat: 1, crop_corn: 1 },
    out: "good_feed",
    minutes: 2,
    unlockLevel: 2,
    xp: 3,
  },
  // Sugar Mill
  {
    id: "sugar",
    factoryId: "sugar_mill",
    name: "Sugar",
    inputs: { crop_sugarcane: 2 },
    out: "good_sugar",
    minutes: 6,
    unlockLevel: 4,
    xp: 9,
  },
  // Textile Mill
  {
    id: "thread",
    factoryId: "textile_mill",
    name: "Thread",
    inputs: { crop_cotton: 2 },
    out: "good_thread",
    minutes: 12,
    unlockLevel: 5,
    xp: 15,
  },
  {
    id: "fabric",
    factoryId: "textile_mill",
    name: "Fabric",
    inputs: { good_thread: 2 },
    out: "good_fabric",
    minutes: 25,
    unlockLevel: 5,
    xp: 30,
  },
  // Juice Press
  {
    id: "juice",
    factoryId: "juice_press",
    name: "Berry Juice",
    inputs: { crop_strawberry: 2 },
    out: "good_juice",
    minutes: 10,
    unlockLevel: 6,
    xp: 18,
  },
  // Tailor
  {
    id: "sunhat",
    factoryId: "tailor",
    name: "Sun Hat",
    inputs: { good_fabric: 1 },
    out: "good_sunhat",
    minutes: 40,
    unlockLevel: 6,
    xp: 55,
  },
  // Cannery
  {
    id: "tomato_sauce",
    factoryId: "cannery",
    name: "Tomato Sauce",
    inputs: { crop_tomato: 3 },
    out: "good_tomato_sauce",
    minutes: 18,
    unlockLevel: 7,
    xp: 24,
  },
  // Kitchen
  {
    id: "veggie_soup",
    factoryId: "kitchen",
    name: "Veggie Soup",
    inputs: { crop_carrot: 2, crop_tomato: 1, crop_potato: 1 },
    out: "good_veggie_soup",
    minutes: 30,
    unlockLevel: 8,
    xp: 40,
  },
  // Confectionery
  {
    id: "cake",
    factoryId: "confectionery",
    name: "Cake",
    inputs: { good_flour: 2, good_sugar: 1 },
    out: "good_cake",
    minutes: 20,
    unlockLevel: 9,
    xp: 28,
  },
  {
    id: "jam",
    factoryId: "confectionery",
    name: "Strawberry Jam",
    inputs: { crop_strawberry: 3, good_sugar: 1 },
    out: "good_jam",
    minutes: 25,
    unlockLevel: 9,
    xp: 34,
  },
  // Chocolate Maker
  {
    id: "chocolate",
    factoryId: "chocolate_maker",
    name: "Chocolate",
    inputs: { crop_cacao: 2, good_sugar: 1 },
    out: "good_chocolate",
    minutes: 45,
    unlockLevel: 12,
    xp: 60,
  },
  {
    id: "choc_cake",
    factoryId: "chocolate_maker",
    name: "Chocolate Cake",
    inputs: { good_cake: 1, good_chocolate: 1 },
    out: "good_choc_cake",
    minutes: 60,
    unlockLevel: 12,
    xp: 90,
  },
];

export const RECIPES: Record<string, RecipeDef> = Object.fromEntries(
  RECIPE_SPECS.map((r) => [
    r.id,
    {
      id: r.id,
      factoryId: r.factoryId,
      name: r.name,
      inputs: r.inputs,
      outputItemId: r.out,
      outputQty: r.outQty ?? 1,
      produceMs: r.minutes * M,
      unlockLevel: r.unlockLevel ?? FACTORIES[r.factoryId].unlockLevel,
      xp: r.xp,
    } satisfies RecipeDef,
  ]),
);
