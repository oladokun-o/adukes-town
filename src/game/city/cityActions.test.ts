import { describe, expect, it } from "vitest";
import {
  collectFactoryBatch,
  depositCoins,
  fulfillOrder,
  harvestPlot,
  plantCrop,
  startFactoryBatch,
  unlockPlot,
} from "@/game/city/cityActions";
import {
  COINS_PER_ORDER,
  CROP_GROW_MS,
  FACTORY_PRODUCE_MS,
  GOODS_PER_ORDER,
  createDefaultCityState,
  plotUnlockCost,
  type CityState,
} from "@/game/city/types";

describe("plantCrop", () => {
  it("starts a crop timer on an unlocked, empty plot", () => {
    const state = createDefaultCityState();
    const next = plantCrop(state, "plot-1", 1000);
    expect(next.plots[0].crop).toEqual({ startedAt: 1000, readyAt: 1000 + CROP_GROW_MS });
  });

  it("is a no-op on a locked plot", () => {
    const state = createDefaultCityState();
    const next = plantCrop(state, "plot-2", 1000);
    expect(next).toBe(state);
  });

  it("is a no-op on an already-planted plot", () => {
    const state = plantCrop(createDefaultCityState(), "plot-1", 1000);
    const next = plantCrop(state, "plot-1", 2000);
    expect(next).toBe(state);
  });

  it("is a no-op on an unknown plot id", () => {
    const state = createDefaultCityState();
    expect(plantCrop(state, "does-not-exist", 1000)).toBe(state);
  });
});

describe("harvestPlot", () => {
  it("is a no-op before the crop is ready", () => {
    const state = plantCrop(createDefaultCityState(), "plot-1", 0);
    const next = harvestPlot(state, "plot-1", CROP_GROW_MS - 1);
    expect(next).toBe(state);
  });

  it("clears the plot and adds one crop to inventory once ready", () => {
    const state = plantCrop(createDefaultCityState(), "plot-1", 0);
    const next = harvestPlot(state, "plot-1", CROP_GROW_MS);
    expect(next.plots[0].crop).toBeNull();
    expect(next.cropInventory).toBe(1);
  });

  it("is a no-op on an empty plot", () => {
    const state = createDefaultCityState();
    expect(harvestPlot(state, "plot-1", 1000)).toBe(state);
  });
});

describe("startFactoryBatch", () => {
  function withCrops(count: number): CityState {
    return { ...createDefaultCityState(), cropInventory: count };
  }

  it("is a no-op without enough crops", () => {
    const state = withCrops(1);
    expect(startFactoryBatch(state, 0)).toBe(state);
  });

  it("consumes crops and starts a batch timer once there are enough", () => {
    const state = withCrops(3);
    const next = startFactoryBatch(state, 1000);
    expect(next.cropInventory).toBe(0);
    expect(next.factory.batch).toEqual({ startedAt: 1000, readyAt: 1000 + FACTORY_PRODUCE_MS });
  });

  it("is a no-op while a batch is already running", () => {
    const running = startFactoryBatch(withCrops(3), 0);
    const attempt = { ...running, cropInventory: 3 };
    const next = startFactoryBatch(attempt, 1000);
    expect(next).toBe(attempt);
  });
});

describe("collectFactoryBatch", () => {
  it("is a no-op before the batch is ready", () => {
    const state = startFactoryBatch({ ...createDefaultCityState(), cropInventory: 3 }, 0);
    const next = collectFactoryBatch(state, FACTORY_PRODUCE_MS - 1);
    expect(next).toBe(state);
  });

  it("clears the batch and adds goods to inventory once ready", () => {
    const state = startFactoryBatch({ ...createDefaultCityState(), cropInventory: 3 }, 0);
    const next = collectFactoryBatch(state, FACTORY_PRODUCE_MS);
    expect(next.factory.batch).toBeNull();
    expect(next.goodsInventory).toBe(1);
  });

  it("is a no-op when the factory is idle", () => {
    const state = createDefaultCityState();
    expect(collectFactoryBatch(state, 1000)).toBe(state);
  });
});

describe("fulfillOrder", () => {
  it("is a no-op without enough goods", () => {
    const state = { ...createDefaultCityState(), goodsInventory: GOODS_PER_ORDER - 1 };
    expect(fulfillOrder(state)).toBe(state);
  });

  it("consumes goods and pays out coins once there are enough", () => {
    const state = { ...createDefaultCityState(), goodsInventory: GOODS_PER_ORDER };
    const next = fulfillOrder(state);
    expect(next.goodsInventory).toBe(0);
    expect(next.coins).toBe(COINS_PER_ORDER);
  });
});

describe("unlockPlot", () => {
  const cost = plotUnlockCost(1); // one plot (plot-1) starts unlocked

  it("is a no-op without enough coins", () => {
    const state = { ...createDefaultCityState(), coins: cost - 1 };
    expect(unlockPlot(state, "plot-2")).toBe(state);
  });

  it("unlocks the plot and deducts the cost once affordable", () => {
    const state = { ...createDefaultCityState(), coins: cost };
    const next = unlockPlot(state, "plot-2");
    expect(next.plots[1].unlocked).toBe(true);
    expect(next.coins).toBe(0);
  });

  it("is a no-op if already unlocked", () => {
    const unlocked = unlockPlot({ ...createDefaultCityState(), coins: cost }, "plot-2");
    const state = { ...unlocked, coins: cost };
    expect(unlockPlot(state, "plot-2")).toBe(state);
  });

  it("is a no-op on an unknown plot id", () => {
    const state = { ...createDefaultCityState(), coins: cost };
    expect(unlockPlot(state, "does-not-exist")).toBe(state);
  });

  it("charges more for each additional plot already unlocked", () => {
    const firstCost = plotUnlockCost(1);
    const secondCost = plotUnlockCost(2);
    expect(secondCost).toBeGreaterThan(firstCost);

    const afterFirst = unlockPlot({ ...createDefaultCityState(), coins: firstCost }, "plot-2");
    expect(afterFirst.coins).toBe(0);

    const withCoinsForSecond = { ...afterFirst, coins: secondCost };
    const afterSecond = unlockPlot(withCoinsForSecond, "plot-3");
    expect(afterSecond.plots[2].unlocked).toBe(true);
    expect(afterSecond.coins).toBe(0);
  });
});

describe("depositCoins", () => {
  it("adds the amount to the coin balance", () => {
    const state = createDefaultCityState();
    expect(depositCoins(state, 42).coins).toBe(42);
  });
});
