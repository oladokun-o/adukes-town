import {
  BASE_BUILDING_SLOTS,
  BASE_POPULATION_CAP,
  getBuilding,
  SLOTS_PER_EXPANSION,
} from "@/game/city/catalog";
import { zooReputation } from "@/game/city/deepEconomy";
import type { CityState } from "@/game/city/types";
import { narrativeReputation } from "@/game/story/types";

// Pure derived views over the town layer (CityState.buildings /
// townExpansions). Nothing here is persisted — it's all recomputed from the
// building counts, so adding a building tomorrow can't desync a save.

// Total buildings placed (sum of counts).
export function buildingsPlaced(state: CityState): number {
  let total = 0;
  for (const n of Object.values(state.buildings)) total += n;
  return total;
}

// How many buildings the town has room for — grows with land expansion.
export function buildingSlots(state: CityState): number {
  return BASE_BUILDING_SLOTS + state.townExpansions * SLOTS_PER_EXPANSION;
}

export function buildingSlotsFree(state: CityState): number {
  return Math.max(0, buildingSlots(state) - buildingsPlaced(state));
}

// Everyone who can live in town: the base plus every house's residents.
export function populationCap(state: CityState): number {
  let cap = BASE_POPULATION_CAP;
  for (const [id, count] of Object.entries(state.buildings)) {
    const def = getBuilding(id);
    if (def?.population) cap += def.population * count;
  }
  return cap;
}

// First pass: the town fills to its cap (residents always move in). Kept as
// its own function so a later phase can make it a timer/goods-gated ramp
// without touching callers.
export function population(state: CityState): number {
  return populationCap(state);
}

// Town reputation: buildings + decorations + zoo habitats + the narrative
// layer (earned relationship hearts, minus an active-setback penalty).
// Clamped at zero so a fresh town with an early setback doesn't read
// negative.
export function townReputation(state: CityState): number {
  let rep = 0;
  for (const [id, count] of Object.entries(state.buildings)) {
    const def = getBuilding(id);
    if (def?.reputation) rep += def.reputation * count;
  }
  return Math.max(0, rep + zooReputation(state) + narrativeReputation(state.story));
}

export function buildingCount(state: CityState, buildingId: string): number {
  return state.buildings[buildingId] ?? 0;
}
