import { describe, expect, it } from "vitest";
import { STARTING_BARN_CAPACITY } from "@/game/city/catalog";
import { createDefaultCityState } from "@/game/city/types";
import { migrateCityState, migrateSaveBundle } from "@/save/migrate";
import type { SaveBundleV1 } from "@/save/saveBundleSchema";

const v1City = {
  coins: 120,
  cropInventory: 4,
  goodsInventory: 2,
  factory: { batch: { startedAt: 10, readyAt: 20 } },
  plots: [
    { id: "plot-1", unlocked: true, crop: { startedAt: 0, readyAt: 100 } },
    { id: "plot-2", unlocked: true, crop: null },
  ],
  lastPlayedLevelId: "level005",
};

describe("migrateCityState", () => {
  it("maps a bare v1 city state to the current shape", () => {
    const next = migrateCityState(v1City);
    expect(next.coins).toBe(120);
    expect(next.inventory).toEqual({ seed_wheat: 8, crop_wheat: 4, good_bread: 2 });
    expect(next.level).toBe(1);
    expect(next.xp).toBe(0);
    expect(next.barnCapacity).toBe(STARTING_BARN_CAPACITY);
    expect(next.plots[0].planting).toEqual({
      cropId: "wheat",
      timer: { startedAt: 0, readyAt: 100 },
    });
    expect(next.plots[1].planting).toBeNull();
    expect(next.factories).toEqual({ bakery: { queue: ["bread"], startedAt: 10 } });
    expect(next.lastPlayedLevelId).toBe("level005");
  });

  it("reads the versioned envelope form", () => {
    const state = { ...createDefaultCityState(), coins: 7 };
    expect(migrateCityState({ schemaVersion: 4, state }).coins).toBe(7);
  });

  it("migrates a v2 factory array to the queue map", () => {
    const v2 = {
      ...createDefaultCityState(),
      factories: [
        { id: "bakery", batch: { recipeId: "bread", timer: { startedAt: 5, readyAt: 9 } } },
        { id: "mill", batch: null },
      ],
    } as unknown;
    expect(migrateCityState(v2).factories).toEqual({
      bakery: { queue: ["bread"], startedAt: 5 },
      mill: { queue: [], startedAt: null },
    });
  });

  it("is idempotent on an already-current state", () => {
    const state = { ...createDefaultCityState(), coins: 55, inventory: { crop_wheat: 1 } };
    expect(migrateCityState(state)).toEqual(state);
  });

  it("falls back to a fresh default for unrecognizable input", () => {
    expect(migrateCityState(null)).toEqual(createDefaultCityState());
    expect(migrateCityState({ garbage: true })).toEqual(createDefaultCityState());
  });
});

describe("migrateSaveBundle", () => {
  it("bumps a v1 bundle to the current version and migrates its city", () => {
    const bundle: SaveBundleV1 = {
      schemaVersion: 1,
      progress: { level001: { Red: 3 } },
      relaxMode: true,
      city: v1City,
    };
    const next = migrateSaveBundle(bundle);
    expect(next.schemaVersion).toBe(4);
    expect(next.progress).toEqual({ level001: { Red: 3 } });
    expect(next.relaxMode).toBe(true);
    expect(next.city.inventory).toEqual({ seed_wheat: 8, crop_wheat: 4, good_bread: 2 });
  });
});
