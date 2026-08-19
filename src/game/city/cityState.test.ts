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
  it("persists to IndexedDB and updates the in-memory cache immediately", async () => {
    const next = { ...createDefaultCityState(), coins: 77 };
    await storeCityState(next);

    expect(getCityState()).toEqual(next);
    expect(await idbGet("city:state")).toEqual(next);
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
  it("hydrates the cache from whatever is persisted in IndexedDB", async () => {
    // written directly, bypassing storeCityState — simulates a value saved
    // in a prior session, before the in-memory cache is hydrated.
    const saved = { ...createDefaultCityState(), coins: 250 };
    await idbSet("city:state", saved);

    await loadCityStateFromDb();
    expect(getCityState()).toEqual(saved);
  });

  it("notifies subscribers so a store created before hydration still picks up the loaded value", async () => {
    // Mirrors the real bootstrap race: cityStore.ts's writable is created
    // (from the pre-hydration default) as a side effect of main.ts's static
    // import graph, before loadCityStateFromDb's awaited idb read resolves.
    const saved = { ...createDefaultCityState(), coins: 99 };
    await idbSet("city:state", saved);

    const listener = vi.fn();
    const unsubscribe = onCityStateChange(listener);

    await loadCityStateFromDb();
    expect(listener).toHaveBeenCalledWith(saved);

    unsubscribe();
  });
});
