import type { ItemId } from "@/game/city/catalog/items";

// Animal pens. Township model: feed the whole pen (costs feed per animal),
// wait a real-time cycle, collect the produce (yield per animal), repeat.
// One cycle at a time per pen — no queue. The produce feeds factory chains
// (Dairy, Bakery cookies/cake, Textile yarn — see factories.ts).

export interface AnimalPenDef {
  id: string;
  name: string;
  animal: string;
  emoji: string;
  count: number; // animals in the pen
  feedItemId: ItemId;
  feedPerAnimal: number;
  producesItemId: ItemId;
  yieldPerAnimal: number;
  produceMs: number;
  unlockLevel: number;
  xp: number; // per collected cycle
}

const M = 60_000;

export const ANIMAL_PENS: Record<string, AnimalPenDef> = {
  chicken_coop: {
    id: "chicken_coop",
    name: "Chicken Coop",
    animal: "Chicken",
    emoji: "🐔",
    count: 4,
    feedItemId: "good_feed",
    feedPerAnimal: 1,
    producesItemId: "good_egg",
    yieldPerAnimal: 1,
    produceMs: 20 * M,
    unlockLevel: 3,
    xp: 12,
  },
  cow_pasture: {
    id: "cow_pasture",
    name: "Cow Pasture",
    animal: "Cow",
    emoji: "🐄",
    count: 3,
    feedItemId: "good_feed",
    feedPerAnimal: 2,
    producesItemId: "good_milk",
    yieldPerAnimal: 1,
    produceMs: 45 * M,
    unlockLevel: 5,
    xp: 25,
  },
  sheep_pen: {
    id: "sheep_pen",
    name: "Sheep Pen",
    animal: "Sheep",
    emoji: "🐑",
    count: 3,
    feedItemId: "good_feed",
    feedPerAnimal: 2,
    producesItemId: "good_wool",
    yieldPerAnimal: 1,
    produceMs: 60 * M,
    unlockLevel: 7,
    xp: 30,
  },
};

export function penFeedCost(pen: AnimalPenDef): number {
  return pen.feedPerAnimal * pen.count;
}

export function penYield(pen: AnimalPenDef): number {
  return pen.yieldPerAnimal * pen.count;
}
