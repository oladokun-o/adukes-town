import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import {
  getStoryState,
  loadStoryStateFromDb,
  onStoryStateChange,
  storeStoryState,
} from "@/game/story/storyState";
import { createDefaultStoryState } from "@/game/story/types";
import { idbGet, idbSet } from "@/save/db";

describe("getStoryState / storeStoryState", () => {
  it("persists to IndexedDB and updates the in-memory cache immediately", async () => {
    const next = { ...createDefaultStoryState() };
    next.characters.dapo = { visits: 2, discoveredFactIds: ["garlic-sauce"], actedOnFactIds: [] };
    await storeStoryState(next);

    expect(getStoryState()).toEqual(next);
    expect(await idbGet("story:state")).toEqual(next);
  });

  it("notifies subscribers registered via onStoryStateChange", async () => {
    const listener = vi.fn();
    const unsubscribe = onStoryStateChange(listener);

    const next = createDefaultStoryState();
    await storeStoryState(next);
    expect(listener).toHaveBeenCalledWith(next);

    unsubscribe();
  });
});

describe("loadStoryStateFromDb", () => {
  it("hydrates the cache from whatever is persisted in IndexedDB", async () => {
    const saved = { ...createDefaultStoryState() };
    saved.characters.dapo = {
      visits: 3,
      discoveredFactIds: ["garlic-sauce", "sees-your-capability"],
      actedOnFactIds: ["garlic-sauce"],
    };
    await idbSet("story:state", saved);

    await loadStoryStateFromDb();
    expect(getStoryState()).toEqual(saved);
  });

  it("notifies subscribers so a store created before hydration still picks up the loaded value", async () => {
    const saved = { ...createDefaultStoryState() };
    saved.characters.dapo = { visits: 1, discoveredFactIds: ["garlic-sauce"], actedOnFactIds: [] };
    await idbSet("story:state", saved);

    const listener = vi.fn();
    const unsubscribe = onStoryStateChange(listener);

    await loadStoryStateFromDb();
    expect(listener).toHaveBeenCalledWith(saved);

    unsubscribe();
  });
});
