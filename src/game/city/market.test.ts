import { describe, expect, it } from "vitest";
import { CROPS } from "@/game/city/catalog";
import { buySeed, sellItem, sellPrice } from "@/game/city/market";
import { createDefaultCityState, type CityState } from "@/game/city/types";

function withCoins(coins: number, extra: Partial<CityState> = {}): CityState {
  return { ...createDefaultCityState(), coins, ...extra };
}

describe("buySeed", () => {
  it("spends coins and adds seeds to the barn", () => {
    const state = withCoins(100, { inventory: {} });
    const next = buySeed(state, "wheat", 5);
    expect(next.coins).toBe(100 - CROPS.wheat.seedCost * 5);
    expect(next.inventory.seed_wheat).toBe(5);
  });

  it("is a no-op when broke, for an unknown crop, a locked crop, or a bad qty", () => {
    const broke = withCoins(0, { inventory: {} });
    expect(buySeed(broke, "wheat", 1)).toBe(broke);
    const rich = withCoins(9999, { inventory: {} });
    expect(buySeed(rich, "dragonfruit", 1)).toBe(rich);
    expect(buySeed(rich, "cacao", 1)).toBe(rich); // unlockLevel 12 > level 1
    expect(buySeed(rich, "wheat", 0)).toBe(rich);
  });

  it("is a no-op when the barn can't fit the seeds", () => {
    const state = withCoins(9999, { barnCapacity: 2, inventory: {} });
    expect(buySeed(state, "wheat", 5)).toBe(state);
  });
});

describe("sellItem", () => {
  it("removes the items and pays the sell price", () => {
    const state = withCoins(0, { inventory: { crop_wheat: 4 } });
    const next = sellItem(state, "crop_wheat", 3);
    expect(next.inventory.crop_wheat).toBe(1);
    expect(next.coins).toBe(sellPrice("crop_wheat") * 3);
  });

  it("is a no-op without enough of the item or for a bad qty", () => {
    const state = withCoins(0, { inventory: { crop_wheat: 1 } });
    expect(sellItem(state, "crop_wheat", 2)).toBe(state);
    expect(sellItem(state, "crop_wheat", 0)).toBe(state);
    expect(sellItem(state, "nonsense", 1)).toBe(state);
  });
});
