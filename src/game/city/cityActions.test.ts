import { describe, expect, it } from "vitest";
import {
  buyPlot,
  collectFactoryBatch,
  depositCoins,
  fulfillOrder,
  harvestPlot,
  plantCrop,
  startFactoryBatch,
} from "@/game/city/cityActions";
import { CROPS, PLOT_COSTS, RECIPES } from "@/game/city/catalog";
import { createDefaultCityState, type CityState } from "@/game/city/types";

const WHEAT_MS = CROPS.wheat.growMs;
const BREAD = RECIPES.bread;

function stocked(inventory: Record<string, number>, extra: Partial<CityState> = {}): CityState {
  return { ...createDefaultCityState(), inventory, ...extra };
}

describe("plantCrop", () => {
  it("starts a crop timer and consumes one seed on an unlocked, empty plot", () => {
    const start = createDefaultCityState();
    const next = plantCrop(start, "plot-1", "wheat", 1000);
    expect(next.plots[0].planting).toEqual({
      cropId: "wheat",
      timer: { startedAt: 1000, readyAt: 1000 + WHEAT_MS },
    });
    expect(next.inventory.seed_wheat).toBe(start.inventory.seed_wheat - 1);
  });

  it("is a no-op with no seed of that crop", () => {
    const state = stocked({});
    expect(plantCrop(state, "plot-1", "wheat", 1000)).toBe(state);
  });

  it("is a no-op on a locked plot, an occupied plot, an unknown plot, or an unknown crop", () => {
    const state = createDefaultCityState();
    expect(plantCrop(state, "plot-2", "wheat", 1000)).toBe(state);
    expect(plantCrop(state, "nope", "wheat", 1000)).toBe(state);
    expect(plantCrop(state, "plot-1", "dragonfruit", 1000)).toBe(state);
    const planted = plantCrop(state, "plot-1", "wheat", 1000);
    expect(plantCrop(planted, "plot-1", "wheat", 2000)).toBe(planted);
  });

  it("is a no-op when the crop's unlock level is above the player's", () => {
    const state = { ...createDefaultCityState(), level: 0 };
    // wheat unlocks at level 1; a level-0 state can't plant it.
    expect(plantCrop(state, "plot-1", "wheat", 1000)).toBe(state);
  });
});

describe("harvestPlot", () => {
  it("is a no-op before the crop is ready", () => {
    const state = plantCrop(createDefaultCityState(), "plot-1", "wheat", 0);
    expect(harvestPlot(state, "plot-1", WHEAT_MS - 1)).toBe(state);
  });

  it("clears the plot, banks the yield, and grants XP once ready", () => {
    const state = plantCrop(createDefaultCityState(), "plot-1", "wheat", 0);
    const next = harvestPlot(state, "plot-1", WHEAT_MS);
    expect(next.plots[0].planting).toBeNull();
    expect(next.inventory.crop_wheat).toBe(CROPS.wheat.yield);
    expect(next.xp).toBe(CROPS.wheat.xp);
  });

  it("is a no-op when the barn is full", () => {
    const planted = plantCrop(
      { ...createDefaultCityState(), barnCapacity: 0 },
      "plot-1",
      "wheat",
      0,
    );
    expect(harvestPlot(planted, "plot-1", WHEAT_MS)).toBe(planted);
  });
});

describe("startFactoryBatch", () => {
  it("is a no-op without the recipe inputs", () => {
    const state = stocked({ crop_wheat: BREAD.inputs.crop_wheat - 1 });
    expect(startFactoryBatch(state, "bakery", "bread", 0)).toBe(state);
  });

  it("consumes inputs and starts the batch timer", () => {
    const state = stocked({ crop_wheat: BREAD.inputs.crop_wheat });
    const next = startFactoryBatch(state, "bakery", "bread", 1000);
    expect(next.inventory.crop_wheat).toBeUndefined();
    expect(next.factories[0].batch).toEqual({
      recipeId: "bread",
      timer: { startedAt: 1000, readyAt: 1000 + BREAD.produceMs },
    });
  });

  it("is a no-op for a wrong-factory recipe or a busy factory", () => {
    const state = stocked({ crop_wheat: BREAD.inputs.crop_wheat });
    expect(startFactoryBatch(state, "bakery", "not-a-recipe", 0)).toBe(state);
    const running = startFactoryBatch(state, "bakery", "bread", 0);
    expect(startFactoryBatch(running, "bakery", "bread", 1000)).toBe(running);
  });
});

describe("collectFactoryBatch", () => {
  it("is a no-op before the batch is ready", () => {
    const running = startFactoryBatch(
      stocked({ crop_wheat: BREAD.inputs.crop_wheat }),
      "bakery",
      "bread",
      0,
    );
    expect(collectFactoryBatch(running, "bakery", BREAD.produceMs - 1)).toBe(running);
  });

  it("banks the output and grants recipe XP once ready", () => {
    const running = startFactoryBatch(
      stocked({ crop_wheat: BREAD.inputs.crop_wheat }),
      "bakery",
      "bread",
      0,
    );
    const next = collectFactoryBatch(running, "bakery", BREAD.produceMs);
    expect(next.factories[0].batch).toBeNull();
    expect(next.inventory.good_bread).toBe(BREAD.outputQty);
    expect(next.xp).toBe(BREAD.xp);
  });
});

describe("fulfillOrder", () => {
  it("is a no-op without the required items", () => {
    const state = createDefaultCityState();
    expect(fulfillOrder(state, state.orders[0].id)).toBe(state);
  });

  it("consumes items, pays coins + XP, and queues a replacement order", () => {
    const base = createDefaultCityState();
    const order = base.orders[0];
    const state = stocked({ ...order.requires });
    const next = fulfillOrder(state, order.id);
    expect(next.coins).toBe(order.rewardCoins);
    expect(next.xp).toBeGreaterThanOrEqual(order.rewardXp);
    expect(next.orders).toHaveLength(1);
    expect(next.orders[0].id).not.toBe(order.id);
  });
});

describe("buyPlot", () => {
  it("unlocks a locked plot and deducts its cost", () => {
    const state = { ...createDefaultCityState(), coins: PLOT_COSTS["plot-2"] };
    const next = buyPlot(state, "plot-2");
    expect(next.plots[1].unlocked).toBe(true);
    expect(next.coins).toBe(0);
  });

  it("is a no-op without the coins, for an unknown plot, or an already-unlocked plot", () => {
    const broke = { ...createDefaultCityState(), coins: PLOT_COSTS["plot-2"] - 1 };
    expect(buyPlot(broke, "plot-2")).toBe(broke);
    const state = createDefaultCityState();
    expect(buyPlot(state, "plot-1")).toBe(state);
    expect(buyPlot(state, "nope")).toBe(state);
  });
});

describe("depositCoins", () => {
  it("adds the amount, ignoring non-positive values", () => {
    const state = createDefaultCityState();
    expect(depositCoins(state, 42).coins).toBe(42);
    expect(depositCoins(state, 0)).toBe(state);
  });
});
