import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import {
  getCityState,
  loadCityStateFromDb,
  onCityStateChange,
  storeCityState,
} from "@/game/city/cityState";
import { createDefaultCityState } from "@/game/city/types";
import { idbGet, idbSet } from "@/save/db";

describe("getCityState / storeCityState", () => {
  it("caches immediately and persists behind a version envelope", async () => {
    const next = { ...createDefaultCityState(), coins: 77 };
    await storeCityState(next);

    expect(getCityState()).toEqual(next);
    const stored = (await idbGet("city:state")) as { schemaVersion: number; state: unknown };
    expect(typeof stored.schemaVersion).toBe("number");
    expect(stored.state).toEqual(next);
  });

  it("notifies subscribers registered via onCityStateChange", async () => {
    const listener = vi.fn();
    const unsubscribe = onCityStateChange(listener);

    const next = { ...createDefaultCityState(), coins: 12 };
    await storeCityState(next);
    expect(listener).toHaveBeenCalledWith(next);

    unsubscribe();
  });
});

describe("loadCityStateFromDb", () => {
  it("round-trips the envelope and notifies a store created before hydration", async () => {
    const saved = { ...createDefaultCityState(), coins: 99 };
    await storeCityState(saved);

    const listener = vi.fn();
    const off = onCityStateChange(listener);
    await loadCityStateFromDb();
    off();

    expect(getCityState().coins).toBe(99);
    expect(listener).toHaveBeenCalled();
  });

  it("migrates a legacy bare (unversioned) blob on load", async () => {
    await idbSet("city:state", {
      coins: 200,
      cropInventory: 3,
      goodsInventory: 0,
      factory: { batch: null },
      plots: [{ id: "plot-1", unlocked: true, crop: null }],
      lastPlayedLevelId: null,
    });

    await loadCityStateFromDb();

    expect(getCityState().coins).toBe(200);
    expect(getCityState().inventory).toEqual({ seed_wheat: 8, crop_wheat: 3 });
    expect(getCityState().level).toBe(1);
    expect(Array.isArray(getCityState().plots)).toBe(true);
    expect(getCityState().animals).toEqual({});
  });
});
