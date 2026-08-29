import { describe, expect, it } from "vitest";
import {
  BASE_BUILDING_SLOTS,
  BASE_POPULATION_CAP,
  BUILDINGS,
  buildingsUnlockedAt,
  expansionCost,
  getBuilding,
  SLOTS_PER_EXPANSION,
  TOWN_EXPANSION_UNLOCK_LEVEL,
} from "@/game/city/catalog";
import { buildStructure, expandTown } from "@/game/city/cityActions";
import {
  buildingSlots,
  buildingSlotsFree,
  buildingsPlaced,
  populationCap,
  townReputation,
} from "@/game/city/town";
import { createDefaultCityState, type CityState } from "@/game/city/types";

function rich(extra: Partial<CityState> = {}): CityState {
  return {
    ...createDefaultCityState(),
    level: 12,
    coins: 100_000,
    materials: { mat_nail: 200, mat_plank: 200, mat_bolt: 200 },
    ...extra,
  };
}

describe("buildings catalog", () => {
  it("keys match ids and every material cost is a known material item", () => {
    for (const [key, def] of Object.entries(BUILDINGS)) {
      expect(def.id).toBe(key);
      for (const id of Object.keys(def.materials)) expect(id.startsWith("mat_")).toBe(true);
    }
  });

  it("buildingsUnlockedAt is a prefix by level", () => {
    expect(buildingsUnlockedAt(0)).toHaveLength(0);
    expect(buildingsUnlockedAt(200).length).toBe(Object.keys(BUILDINGS).length);
  });
});

describe("town derived views", () => {
  it("population cap is base plus every house's residents", () => {
    const s = rich({ buildings: { cabin: 2, town_hall: 1 } });
    expect(populationCap(s)).toBe(BASE_POPULATION_CAP + getBuilding("cabin")!.population! * 2);
  });

  it("reputation sums community + decoration values", () => {
    const s = rich({ buildings: { town_hall: 1, flowerbed: 3 } });
    expect(townReputation(s)).toBe(
      getBuilding("town_hall")!.reputation! + getBuilding("flowerbed")!.reputation! * 3,
    );
  });

  it("slots grow with expansions", () => {
    expect(buildingSlots(rich())).toBe(BASE_BUILDING_SLOTS);
    expect(buildingSlots(rich({ townExpansions: 2 }))).toBe(
      BASE_BUILDING_SLOTS + 2 * SLOTS_PER_EXPANSION,
    );
    const s = rich({ townExpansions: 1, buildings: { cabin: 3 } });
    expect(buildingsPlaced(s)).toBe(3);
    expect(buildingSlotsFree(s)).toBe(BASE_BUILDING_SLOTS + SLOTS_PER_EXPANSION - 3);
  });
});

describe("buildStructure", () => {
  it("places a building, charging coins + materials and awarding XP", () => {
    const s = rich();
    const next = buildStructure(s, "cottage");
    expect(next).not.toBe(s);
    expect(next.buildings.cottage).toBe(1);
    expect(next.coins).toBe(s.coins - BUILDINGS.cottage.coins);
    expect(next.materials.mat_plank).toBe(200 - BUILDINGS.cottage.materials.mat_plank);
    expect(next.xp).toBe(BUILDINGS.cottage.xp);
  });

  it("is a no-op when locked, unaffordable, capped, or out of slots", () => {
    const locked = rich({ level: 1 });
    expect(buildStructure(locked, "apartments")).toBe(locked);

    const broke = rich({ coins: 0 });
    expect(buildStructure(broke, "cottage")).toBe(broke);

    const noMats = rich({ materials: {} });
    expect(buildStructure(noMats, "cottage")).toBe(noMats);

    const capped = rich({ buildings: { town_hall: 1 } });
    expect(buildStructure(capped, "town_hall")).toBe(capped);

    const full = rich({ buildings: { cabin: BASE_BUILDING_SLOTS } });
    expect(buildStructure(full, "cabin")).toBe(full);
  });
});

describe("expandTown", () => {
  it("buys a land slab, charging the rising cost", () => {
    const s = rich();
    const next = expandTown(s);
    expect(next.townExpansions).toBe(1);
    expect(next.coins).toBe(s.coins - expansionCost(0).coins);
    expect(expandTown(next).coins).toBe(next.coins - expansionCost(1).coins);
  });

  it("is gated by level and cost", () => {
    const early = rich({ level: TOWN_EXPANSION_UNLOCK_LEVEL - 1 });
    expect(expandTown(early)).toBe(early);
    const broke = rich({ coins: 0, materials: {} });
    expect(expandTown(broke)).toBe(broke);
  });
});
