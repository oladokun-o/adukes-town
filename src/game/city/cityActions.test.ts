import { describe, expect, it } from "vitest";
import {
  buyPlot,
  collectFactory,
  collectPen,
  depositCoins,
  feedPen,
  fulfillOrder,
  harvestPlot,
  plantCrop,
  queueRecipe,
} from "@/game/city/cityActions";
import {
  ANIMAL_PENS,
  CROPS,
  penFeedCost,
  penYield,
  PLOT_COSTS,
  RECIPES,
} from "@/game/city/catalog";
import { QUEUE_CAPACITY } from "@/game/city/factory";
import { createDefaultCityState, type CityState } from "@/game/city/types";

const WHEAT_MS = CROPS.wheat.growMs;
const FLOUR = RECIPES.flour; // mill: crop_wheat x2 -> good_flour
const BREAD = RECIPES.bread; // bakery: good_flour x2 -> good_bread

function stocked(inventory: Record<string, number>, extra: Partial<CityState> = {}): CityState {
  // Roomy barn by default so tests exercise the action under test, not the
  // capacity guard (which has its own dedicated cases).
  return { ...createDefaultCityState(), barnCapacity: 100_000, inventory, ...extra };
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

describe("queueRecipe", () => {
  it("is a no-op without the recipe inputs", () => {
    const state = stocked({ crop_wheat: FLOUR.inputs.crop_wheat - 1 });
    expect(queueRecipe(state, "mill", "flour", 0)).toBe(state);
  });

  it("consumes inputs and starts the queue's first slot cooking", () => {
    const state = stocked({ crop_wheat: FLOUR.inputs.crop_wheat });
    const next = queueRecipe(state, "mill", "flour", 1000);
    expect(next.inventory.crop_wheat).toBeUndefined();
    expect(next.factories.mill).toEqual({ queue: ["flour"], startedAt: 1000 });
  });

  it("stacks a second recipe behind the first without resetting the clock", () => {
    let state = stocked({ crop_wheat: FLOUR.inputs.crop_wheat * 2 });
    state = queueRecipe(state, "mill", "flour", 1000);
    state = queueRecipe(state, "mill", "flour", 5000);
    expect(state.factories.mill).toEqual({ queue: ["flour", "flour"], startedAt: 1000 });
  });

  it("is a no-op for a wrong-factory recipe, a locked recipe, or a full queue", () => {
    const state = stocked({ crop_wheat: 999 });
    expect(queueRecipe(state, "mill", "not-a-recipe", 0)).toBe(state);
    expect(queueRecipe(state, "mill", "bread", 0)).toBe(state); // bread is bakery's
    let full = state;
    for (let i = 0; i < QUEUE_CAPACITY; i++) full = queueRecipe(full, "mill", "flour", 0);
    expect(queueRecipe(full, "mill", "flour", 1)).toBe(full);
  });
});

describe("collectFactory", () => {
  it("is a no-op before the first slot is done", () => {
    const running = queueRecipe(stocked({ crop_wheat: 999 }), "mill", "flour", 0);
    expect(collectFactory(running, "mill", FLOUR.produceMs - 1)).toBe(running);
  });

  it("banks finished outputs, grants XP, and slides the queue forward", () => {
    let state = stocked({ crop_wheat: 999 });
    state = queueRecipe(state, "mill", "flour", 0);
    state = queueRecipe(state, "mill", "flour", 0);
    // first slot done, second still cooking
    const next = collectFactory(state, "mill", FLOUR.produceMs + 1);
    expect(next.inventory.good_flour).toBe(FLOUR.outputQty);
    expect(next.xp).toBe(FLOUR.xp);
    expect(next.factories.mill.queue).toEqual(["flour"]);
    expect(next.factories.mill.startedAt).toBe(FLOUR.produceMs);
  });

  it("collects every finished slot at once", () => {
    let state = stocked({ crop_wheat: 999 });
    state = queueRecipe(state, "mill", "flour", 0);
    state = queueRecipe(state, "mill", "flour", 0);
    const next = collectFactory(state, "mill", FLOUR.produceMs * 2 + 1);
    expect(next.inventory.good_flour).toBe(FLOUR.outputQty * 2);
    expect(next.factories.mill).toEqual({ queue: [], startedAt: null });
  });

  it("is a no-op (all-or-nothing) when the barn can't fit the whole finished batch", () => {
    let state = stocked({ crop_wheat: 999 }, { barnCapacity: 999 });
    state = queueRecipe(state, "mill", "flour", 0);
    state = { ...state, barnCapacity: 0 };
    expect(collectFactory(state, "mill", FLOUR.produceMs)).toBe(state);
  });
});

// A two-step chain end to end: wheat -> flour (mill) -> bread (bakery).
describe("production chain", () => {
  it("mill flour feeds the bakery's bread recipe", () => {
    let state = stocked({ crop_wheat: 4 });
    state = queueRecipe(state, "mill", "flour", 0);
    state = queueRecipe(state, "mill", "flour", 0);
    state = collectFactory(state, "mill", FLOUR.produceMs * 2);
    expect(state.inventory.good_flour).toBe(2);
    state = queueRecipe(state, "bakery", "bread", FLOUR.produceMs * 2);
    expect(state.inventory.good_flour).toBeUndefined();
    state = collectFactory(state, "bakery", FLOUR.produceMs * 2 + BREAD.produceMs);
    expect(state.inventory.good_bread).toBe(BREAD.outputQty);
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

describe("feedPen / collectPen", () => {
  const COOP = ANIMAL_PENS.chicken_coop;
  const cost = penFeedCost(COOP);

  function ready(): CityState {
    return stocked({ good_feed: cost + 3 }, { level: COOP.unlockLevel });
  }

  it("is a no-op below the pen's unlock level or without feed", () => {
    expect(feedPen(stocked({ good_feed: 99 }, { level: 1 }), "chicken_coop", 0)).toEqual(
      stocked({ good_feed: 99 }, { level: 1 }),
    );
    const poor = stocked({ good_feed: cost - 1 }, { level: COOP.unlockLevel });
    expect(feedPen(poor, "chicken_coop", 0)).toBe(poor);
  });

  it("feeding spends feed and starts the cycle; can't feed twice", () => {
    const fed = feedPen(ready(), "chicken_coop", 1000);
    expect(fed.inventory.good_feed).toBe(3);
    expect(fed.animals.chicken_coop).toEqual({ startedAt: 1000 });
    expect(feedPen(fed, "chicken_coop", 2000)).toBe(fed);
  });

  it("collecting before ready is a no-op; after ready banks the yield + XP", () => {
    const fed = feedPen(ready(), "chicken_coop", 0);
    expect(collectPen(fed, "chicken_coop", COOP.produceMs - 1)).toBe(fed);
    const got = collectPen(fed, "chicken_coop", COOP.produceMs);
    expect(got.inventory[COOP.producesItemId]).toBe(penYield(COOP));
    expect(got.xp).toBe(COOP.xp);
    expect(got.animals.chicken_coop).toEqual({ startedAt: null });
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
