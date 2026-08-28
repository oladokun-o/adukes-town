import type { ItemId } from "@/game/city/catalog/items";

// Field crops. Grow times climb steeply (seconds → hours) the way Township's
// do; offline catch-up (timestamps computed on load) makes the long ones
// painless. `growMs` / `yield` here are the source of truth.

export interface CropDef {
  id: string;
  name: string;
  producesItemId: ItemId;
  yield: number;
  growMs: number;
  seedItemId: ItemId;
  seedCost: number;
  unlockLevel: number;
  // XP granted per harvest — scales with the crop's tier.
  xp: number;
  sprite?: string;
}

const S = 1000;
const M = 60 * S;
const H = 60 * M;

interface CropSpec {
  id: string;
  name: string;
  growMs: number;
  yield: number;
  unlockLevel: number;
  seedCost: number;
}

const SPECS: CropSpec[] = [
  { id: "wheat", name: "Wheat", growMs: 1 * M, yield: 1, unlockLevel: 1, seedCost: 1 },
  { id: "corn", name: "Corn", growMs: 2 * M, yield: 1, unlockLevel: 2, seedCost: 2 },
  { id: "carrot", name: "Carrot", growMs: 5 * M, yield: 1, unlockLevel: 3, seedCost: 3 },
  { id: "sugarcane", name: "Sugarcane", growMs: 10 * M, yield: 2, unlockLevel: 4, seedCost: 5 },
  { id: "cotton", name: "Cotton", growMs: 20 * M, yield: 2, unlockLevel: 5, seedCost: 9 },
  { id: "strawberry", name: "Strawberry", growMs: 30 * M, yield: 2, unlockLevel: 6, seedCost: 13 },
  { id: "tomato", name: "Tomato", growMs: 45 * M, yield: 2, unlockLevel: 7, seedCost: 18 },
  { id: "potato", name: "Potato", growMs: 1 * H, yield: 3, unlockLevel: 8, seedCost: 24 },
  { id: "pumpkin", name: "Pumpkin", growMs: 2 * H, yield: 3, unlockLevel: 10, seedCost: 44 },
  { id: "cacao", name: "Cacao", growMs: 4 * H, yield: 3, unlockLevel: 12, seedCost: 76 },
];

export const CROPS: Record<string, CropDef> = Object.fromEntries(
  SPECS.map((s) => [
    s.id,
    {
      id: s.id,
      name: s.name,
      producesItemId: `crop_${s.id}`,
      yield: s.yield,
      growMs: s.growMs,
      seedItemId: `seed_${s.id}`,
      seedCost: s.seedCost,
      unlockLevel: s.unlockLevel,
      xp: s.unlockLevel,
    } satisfies CropDef,
  ]),
);
