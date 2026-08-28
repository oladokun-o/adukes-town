import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createDefaultCityState } from "@/game/city/types";
import { idbSet } from "@/save/db";
import {
  getCityState,
  loadCityStateFromDb,
  onCityStateChange,
  storeCityState,
} from "@/save/cityState";

describe("cityState persistence", () => {
  it("persists and reloads through the versioned envelope", async () => {
    await storeCityState({ ...createDefaultCityState(), coins: 88 });
    await loadCityStateFromDb();
    expect(getCityState().coins).toBe(88);
  });

  it("migrates a legacy bare v1 blob on load and notifies listeners", async () => {
    await idbSet("city:state", {
      coins: 200,
      cropInventory: 3,
      goodsInventory: 0,
      factory: { batch: null },
      plots: [{ id: "plot-1", unlocked: true, crop: null }],
      lastPlayedLevelId: null,
    });

    let notified: number | null = null;
    const off = onCityStateChange((s) => (notified = s.coins));
    await loadCityStateFromDb();
    off();

    expect(getCityState().coins).toBe(200);
    expect(getCityState().inventory).toEqual({ crop_wheat: 3 });
    expect(getCityState().level).toBe(1);
    expect(notified).toBe(200);
  });
});
