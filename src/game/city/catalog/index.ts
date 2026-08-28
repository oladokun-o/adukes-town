// Public entry point for the content catalog. Re-exports the raw data plus
// the derived lookups the domain layer needs. Lookups return `undefined`
// for unknown ids (never throw) so the guarded actions in cityActions.ts
// can treat a bad id as a no-op, matching the project's "stray click = no
// crash" rule.

export * from "@/game/city/catalog/items";
export * from "@/game/city/catalog/crops";
export * from "@/game/city/catalog/factories";
export * from "@/game/city/catalog/animals";
export * from "@/game/city/catalog/orders";
export * from "@/game/city/catalog/transport";
export * from "@/game/city/catalog/unlocks";

import { ITEMS, type ItemDef, type ItemId } from "@/game/city/catalog/items";
import { CROPS, type CropDef } from "@/game/city/catalog/crops";
import { FACTORIES, RECIPES, type FactoryDef, type RecipeDef } from "@/game/city/catalog/factories";
import { ANIMAL_PENS, type AnimalPenDef } from "@/game/city/catalog/animals";
import { STARTING_BARN_CAPACITY, UNLOCKS } from "@/game/city/catalog/unlocks";

export function getItem(id: ItemId): ItemDef | undefined {
  return ITEMS[id];
}

export function getCrop(id: string): CropDef | undefined {
  return CROPS[id];
}

export function getFactory(id: string): FactoryDef | undefined {
  return FACTORIES[id];
}

export function getRecipe(id: string): RecipeDef | undefined {
  return RECIPES[id];
}

export function cropsUnlockedAt(level: number): CropDef[] {
  return Object.values(CROPS).filter((c) => c.unlockLevel <= level);
}

export function factoriesUnlockedAt(level: number): FactoryDef[] {
  return Object.values(FACTORIES).filter((f) => f.unlockLevel <= level);
}

export function recipesUnlockedAt(level: number): RecipeDef[] {
  return Object.values(RECIPES).filter((r) => r.unlockLevel <= level);
}

export function recipesForFactory(factoryId: string, level: number): RecipeDef[] {
  return recipesUnlockedAt(level).filter((r) => r.factoryId === factoryId);
}

export function getAnimalPen(id: string): AnimalPenDef | undefined {
  return ANIMAL_PENS[id];
}

export function animalPensUnlockedAt(level: number): AnimalPenDef[] {
  return Object.values(ANIMAL_PENS).filter((p) => p.unlockLevel <= level);
}

// Highest barnCapacity declared at or below `level`, floored at the
// starting capacity. Monotonic by construction.
export function barnCapacityForLevel(level: number): number {
  let capacity = STARTING_BARN_CAPACITY;
  for (const [lvl, unlock] of Object.entries(UNLOCKS)) {
    if (Number(lvl) <= level && unlock.barnCapacity !== undefined) {
      capacity = Math.max(capacity, unlock.barnCapacity);
    }
  }
  return capacity;
}
