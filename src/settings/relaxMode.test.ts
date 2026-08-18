import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  applyRelaxMode,
  isRelaxModeEnabled,
  loadRelaxModeFromDb,
  setRelaxModeEnabled,
} from "@/settings/relaxMode";
import { idbGet, idbSet } from "@/save/db";

describe("applyRelaxMode", () => {
  it("leaves the move limit untouched when disabled", () => {
    expect(applyRelaxMode(20, false)).toBe(20);
  });

  it("scales the move limit up by 1.5x, rounded up, when enabled", () => {
    expect(applyRelaxMode(20, true)).toBe(30);
    expect(applyRelaxMode(15, true)).toBe(23);
  });
});

describe("isRelaxModeEnabled / setRelaxModeEnabled", () => {
  it("persists the flag to IndexedDB and updates the in-memory cache immediately", async () => {
    await setRelaxModeEnabled(true);
    expect(isRelaxModeEnabled()).toBe(true);
    expect(await idbGet("settings:relax-mode")).toBe(true);

    await setRelaxModeEnabled(false);
    expect(isRelaxModeEnabled()).toBe(false);
    expect(await idbGet("settings:relax-mode")).toBe(false);
  });

  it("loadRelaxModeFromDb hydrates the cache from whatever is persisted in IndexedDB", async () => {
    // written directly, bypassing setRelaxModeEnabled — simulates a value
    // saved in a prior session, before the in-memory cache is hydrated.
    await idbSet("settings:relax-mode", true);

    await loadRelaxModeFromDb();
    expect(isRelaxModeEnabled()).toBe(true);
  });
});
