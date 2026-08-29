import { describe, expect, it } from "vitest";
import { CHARACTER_IDS } from "@/game/story";
import { createDefaultCityState } from "@/game/city/types";
import { migrateCityState, migrateSaveBundle } from "@/save/migrate";
import { SCHEMA_VERSION } from "@/save/saveBundleSchema";

// A guard that a save written by ANY past version still loads into a
// complete current CityState — every field the game reads must be present
// and well-typed after migration, or a returning player crashes on boot.

function assertComplete(s: ReturnType<typeof createDefaultCityState>): void {
  // Phase 0-4
  expect(typeof s.coins).toBe("number");
  expect(typeof s.level).toBe("number");
  expect(typeof s.barnCapacity).toBe("number");
  expect(Array.isArray(s.plots)).toBe(true);
  expect(s.plots.length).toBeGreaterThan(0);
  expect(typeof s.factories).toBe("object");
  expect(typeof s.animals).toBe("object");
  expect(s.orders).toHaveLength(createDefaultCityState().orders.length);
  expect(Array.isArray(s.train.wagons)).toBe(true);
  expect(s.plane.manifest.requires).toBeTruthy();
  // Phase 5
  expect(typeof s.buildings).toBe("object");
  expect(typeof s.townExpansions).toBe("number");
  // Phase 6
  expect(typeof s.tokens).toBe("number");
  expect(typeof s.stats).toBe("object");
  expect(Array.isArray(s.achievements)).toBe(true);
  expect(typeof s.daily.streak).toBe("number");
  expect(typeof s.balloon.seed).toBe("number");
  expect(typeof s.mine.picks).toBe("number");
  expect(Array.isArray(s.zoo)).toBe(true);
  expect(s.harbor.manifest.requires).toBeTruthy();
  // Phase 7
  expect(typeof s.lives.count).toBe("number");
  expect(typeof s.lives.since).toBe("number");
  expect(typeof s.boosterCharges).toBe("number");
  // Phase 8
  for (const id of CHARACTER_IDS) {
    expect(typeof s.story.characters[id].hearts).toBe("number");
    expect(Array.isArray(s.story.characters[id].discoveredFactIds)).toBe(true);
  }
  expect(typeof s.story.setbackSeed).toBe("number");
}

describe("save migration — every historical shape loads complete", () => {
  it("bare v1 city blob → complete current state", () => {
    const v1 = {
      coins: 250,
      cropInventory: 6,
      goodsInventory: 3,
      factory: { batch: { startedAt: 100, readyAt: 500 } },
      plots: [
        { id: "plot-1", unlocked: true, crop: { startedAt: 0, readyAt: 90 } },
        { id: "plot-2", unlocked: true, crop: null },
      ],
      lastPlayedLevelId: "level007",
    };
    const migrated = migrateCityState(v1);
    assertComplete(migrated);
    expect(migrated.coins).toBe(250);
    expect(migrated.inventory.crop_wheat).toBe(6);
    expect(migrated.lastPlayedLevelId).toBe("level007");
  });

  it("a mid-era 'modern' blob missing Phase 6-8 fields → filled in, data kept", () => {
    const v5ish = {
      coins: 9000,
      xp: 4000,
      level: 11,
      barnCapacity: 320,
      barnUpgrades: 3,
      inventory: { crop_wheat: 20, good_bread: 8 },
      materials: { mat_nail: 12 },
      plots: createDefaultCityState().plots,
      factories: { bakery: { queue: ["bread"], startedAt: 123 } },
      animals: { chicken_coop: { startedAt: 456 } },
      orders: createDefaultCityState().orders,
      train: createDefaultCityState().train,
      plane: createDefaultCityState().plane,
      buildings: { cabin: 2, town_hall: 1 },
      townExpansions: 1,
      lastPlayedLevelId: "level012",
    };
    const migrated = migrateCityState(v5ish);
    assertComplete(migrated);
    expect(migrated.coins).toBe(9000);
    expect(migrated.buildings).toEqual({ cabin: 2, town_hall: 1 });
    expect(migrated.tokens).toBe(0);
    expect(migrated.story.characters.dapo.hearts).toBe(0);
  });

  it("a current state round-trips unchanged (idempotent) and stays complete", () => {
    const current = { ...createDefaultCityState(), coins: 42, tokens: 3 };
    const once = migrateCityState(current);
    const twice = migrateCityState(once);
    expect(twice).toEqual(once);
    assertComplete(twice);
  });

  it("migrateSaveBundle stamps the current schema version", () => {
    const next = migrateSaveBundle({
      schemaVersion: 1,
      progress: {},
      relaxMode: false,
      city: {
        coins: 0,
        cropInventory: 0,
        goodsInventory: 0,
        factory: { batch: null },
        plots: [],
        lastPlayedLevelId: null,
      },
    });
    expect(next.schemaVersion).toBe(SCHEMA_VERSION);
    assertComplete(next.city);
  });

  it("garbage in → a fresh, complete default", () => {
    assertComplete(migrateCityState(null));
    assertComplete(migrateCityState({ nonsense: true }));
    assertComplete(migrateCityState("wat" as unknown));
  });
});
