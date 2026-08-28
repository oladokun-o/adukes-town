import { describe, expect, it } from "vitest";
import {
  barnCapacityForLevel,
  CROPS,
  FACTORIES,
  generateOrder,
  ITEMS,
  orderableItemsAt,
  RECIPES,
  STARTING_BARN_CAPACITY,
  UNLOCKS,
} from "@/game/city/catalog";

describe("catalog integrity", () => {
  it("keys match each def's own id", () => {
    for (const [key, def] of Object.entries(ITEMS)) expect(def.id).toBe(key);
    for (const [key, def] of Object.entries(CROPS)) expect(def.id).toBe(key);
    for (const [key, def] of Object.entries(FACTORIES)) expect(def.id).toBe(key);
    for (const [key, def] of Object.entries(RECIPES)) expect(def.id).toBe(key);
  });

  it("every referenced item id exists", () => {
    for (const crop of Object.values(CROPS)) {
      expect(ITEMS[crop.producesItemId]).toBeDefined();
      expect(ITEMS[crop.seedItemId]).toBeDefined();
    }
    for (const recipe of Object.values(RECIPES)) {
      expect(ITEMS[recipe.outputItemId]).toBeDefined();
      for (const id of Object.keys(recipe.inputs)) expect(ITEMS[id]).toBeDefined();
      expect(FACTORIES[recipe.factoryId]).toBeDefined();
    }
  });

  it("every id named in UNLOCKS resolves", () => {
    for (const unlock of Object.values(UNLOCKS)) {
      for (const id of unlock.crops ?? []) expect(CROPS[id]).toBeDefined();
      for (const id of unlock.factories ?? []) expect(FACTORIES[id]).toBeDefined();
      for (const id of unlock.recipes ?? []) expect(RECIPES[id]).toBeDefined();
    }
  });
});

describe("barnCapacityForLevel", () => {
  it("is monotonic non-decreasing and never below the starting capacity", () => {
    let prev = 0;
    for (let level = 1; level <= 20; level++) {
      const cap = barnCapacityForLevel(level);
      expect(cap).toBeGreaterThanOrEqual(STARTING_BARN_CAPACITY);
      expect(cap).toBeGreaterThanOrEqual(prev);
      prev = cap;
    }
  });
});

describe("generateOrder", () => {
  it("is deterministic for a given seed and level", () => {
    expect(generateOrder(42, 3)).toEqual(generateOrder(42, 3));
  });

  it("only asks for items unlocked at that level", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const order = generateOrder(seed, 1);
      const allowed = new Set(orderableItemsAt(1));
      for (const id of Object.keys(order.requires)) expect(allowed.has(id)).toBe(true);
      expect(Object.keys(order.requires).length).toBeGreaterThan(0);
      expect(order.rewardCoins).toBeGreaterThan(0);
      expect(order.rewardXp).toBeGreaterThan(0);
    }
  });
});
