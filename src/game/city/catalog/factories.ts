import type { ItemId } from "@/game/city/catalog/items";

// Factories and their recipes. A factory is a placed building; a recipe is
// one input→output conversion it can run. Phase 0 ships the bakery only
// (parity with the old single-factory slice). Phase 2 fills this to ~12
// factories with multi-input chains and per-factory production queues.

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

export const FACTORIES: Record<string, FactoryDef> = {
  bakery: { id: "bakery", name: "Bakery", unlockLevel: 1 },
};

export const RECIPES: Record<string, RecipeDef> = {
  bread: {
    id: "bread",
    factoryId: "bakery",
    name: "Bread",
    inputs: { crop_wheat: 3 },
    outputItemId: "good_bread",
    outputQty: 1,
    produceMs: 90_000,
    unlockLevel: 1,
    xp: 5,
  },
};
