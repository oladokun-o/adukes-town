import { describe, expect, it } from "vitest";
import { FARM_PLOT_COUNT, createDefaultCityState, plotUnlockCost } from "@/game/city/types";

describe("createDefaultCityState", () => {
  it("starts with zeroed inventories and no coins", () => {
    const state = createDefaultCityState();
    expect(state.coins).toBe(0);
    expect(state.cropInventory).toBe(0);
    expect(state.goodsInventory).toBe(0);
    expect(state.lastPlayedLevelId).toBeNull();
    expect(state.factory.batch).toBeNull();
  });

  it("starts with the full farm grid generated, only the first plot unlocked", () => {
    const state = createDefaultCityState();
    expect(state.plots).toHaveLength(FARM_PLOT_COUNT);
    expect(state.plots[0]).toEqual({ id: "plot-1", unlocked: true, crop: null });
    for (const plot of state.plots.slice(1)) {
      expect(plot.unlocked).toBe(false);
      expect(plot.crop).toBeNull();
    }
  });

  it("returns an independent object each call, safe to mutate", () => {
    const a = createDefaultCityState();
    const b = createDefaultCityState();
    a.coins = 100;
    a.plots[0].crop = { startedAt: 0, readyAt: 1 };
    expect(b.coins).toBe(0);
    expect(b.plots[0].crop).toBeNull();
  });
});

describe("plotUnlockCost", () => {
  it("escalates with each additional plot already unlocked", () => {
    const first = plotUnlockCost(1);
    const second = plotUnlockCost(2);
    const third = plotUnlockCost(3);
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
  });
});
