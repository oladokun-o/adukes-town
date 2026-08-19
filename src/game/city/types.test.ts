import { describe, expect, it } from "vitest";
import { createDefaultCityState } from "@/game/city/types";

describe("createDefaultCityState", () => {
  it("starts with zeroed inventories and no coins", () => {
    const state = createDefaultCityState();
    expect(state.coins).toBe(0);
    expect(state.cropInventory).toBe(0);
    expect(state.goodsInventory).toBe(0);
    expect(state.lastPlayedLevelId).toBeNull();
    expect(state.factory.batch).toBeNull();
  });

  it("starts with one unlocked plot and one locked plot, both empty", () => {
    const state = createDefaultCityState();
    expect(state.plots).toEqual([
      { id: "plot-1", unlocked: true, crop: null },
      { id: "plot-2", unlocked: false, crop: null },
    ]);
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
