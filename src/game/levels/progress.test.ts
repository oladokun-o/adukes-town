import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  clearProgress,
  getStoredProgress,
  loadProgressFromDb,
  storeProgress,
} from "@/game/levels/progress";
import { idbGet } from "@/save/db";

describe("progress (injected cache)", () => {
  it("returns {} when nothing is stored", () => {
    const cache = new Map();
    expect(getStoredProgress("level001", cache)).toEqual({});
  });

  it("round-trips stored progress", () => {
    const cache = new Map();
    storeProgress("level001", { Red: 8, Blue: 3 }, cache);
    expect(getStoredProgress("level001", cache)).toEqual({ Red: 8, Blue: 3 });
  });

  it("clear removes stored progress", () => {
    const cache = new Map();
    storeProgress("level001", { Red: 8 }, cache);
    clearProgress("level001", cache);
    expect(getStoredProgress("level001", cache)).toEqual({});
  });

  it("keeps progress for different levels separate", () => {
    const cache = new Map();
    storeProgress("level001", { Red: 8 }, cache);
    storeProgress("level002", { Blue: 2 }, cache);
    expect(getStoredProgress("level001", cache)).toEqual({ Red: 8 });
    expect(getStoredProgress("level002", cache)).toEqual({ Blue: 2 });
  });
});

// These exercise the real (default) cache backed by IndexedDB — the path
// storeProgress/clearProgress take with no injected cache — so they share
// module state across `it` blocks within this file; distinct level ids per
// test keep them independent.
describe("progress (default cache, backed by IndexedDB)", () => {
  it("storeProgress on the default cache persists to IndexedDB", async () => {
    await storeProgress("level-idb-a", { Red: 5 });
    expect(await idbGet("progress:level-idb-a")).toEqual({ Red: 5 });
    expect(getStoredProgress("level-idb-a")).toEqual({ Red: 5 });
  });

  it("clearProgress on the default cache removes it from IndexedDB", async () => {
    await storeProgress("level-idb-b", { Blue: 2 });
    await clearProgress("level-idb-b");
    expect(getStoredProgress("level-idb-b")).toEqual({});
    expect(await idbGet("progress:level-idb-b")).toBeUndefined();
  });

  it("loadProgressFromDb hydrates the default cache from IndexedDB", async () => {
    await storeProgress("level-idb-c", { Green: 3 });

    // simulate a fresh page load: a brand-new cache, then hydrate it.
    const cache = new Map();
    expect(getStoredProgress("level-idb-c", cache)).toEqual({});

    await loadProgressFromDb(["level-idb-c"]);
    expect(getStoredProgress("level-idb-c")).toEqual({ Green: 3 });
  });
});
