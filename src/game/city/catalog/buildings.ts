// Town buildings — the Phase 5 layer on top of the farm/factory economy.
// Township model: coins + building materials (from the train) buy houses
// (raise the population cap), community buildings (raise town reputation and
// gate later unlocks), and decorations (small reputation, pure cosmetic).
// Engine-agnostic static data, same shape as the rest of catalog/.

export type BuildingKind = "house" | "community" | "decoration";

export interface BuildingDef {
  id: string;
  name: string;
  kind: BuildingKind;
  emoji: string;
  coins: number;
  // Keyed by material item id (mat_nail / mat_plank / mat_bolt — what the
  // train delivers). Empty for the cheapest starter buildings.
  materials: Record<string, number>;
  unlockLevel: number;
  // Houses: residents this adds to the population cap.
  population?: number;
  // Community + decorations: town-reputation points this adds while placed.
  reputation?: number;
  // XP awarded once, when it's built.
  xp: number;
  // Cap on how many of this building the town may hold. Houses/decorations
  // default to unlimited; community buildings are usually unique.
  maxCount?: number;
}

// Everyone who lives in town before the first house is built.
export const BASE_POPULATION_CAP = 4;

// Land expansion — buys another slab of buildable slots. Gated by level;
// cost climbs with each one already owned.
export const TOWN_EXPANSION_UNLOCK_LEVEL = 3;
export const SLOTS_PER_EXPANSION = 4;
// Buildable slots before buying any expansion.
export const BASE_BUILDING_SLOTS = 4;

export function expansionCost(owned: number): { coins: number; materials: Record<string, number> } {
  return {
    coins: 500 + owned * 750,
    materials: {
      mat_plank: 4 + owned * 3,
      mat_nail: 6 + owned * 4,
      mat_bolt: owned,
    },
  };
}

const BUILDING_LIST: BuildingDef[] = [
  // --- Houses -----------------------------------------------------------
  {
    id: "cabin",
    name: "Cabin",
    kind: "house",
    emoji: "🛖",
    coins: 120,
    materials: {},
    unlockLevel: 1,
    population: 3,
    xp: 10,
  },
  {
    id: "cottage",
    name: "Cottage",
    kind: "house",
    emoji: "🏡",
    coins: 400,
    materials: { mat_plank: 3, mat_nail: 4 },
    unlockLevel: 3,
    population: 5,
    xp: 25,
  },
  {
    id: "townhouse",
    name: "Townhouse",
    kind: "house",
    emoji: "🏘️",
    coins: 1100,
    materials: { mat_plank: 6, mat_nail: 8, mat_bolt: 2 },
    unlockLevel: 6,
    population: 8,
    xp: 55,
  },
  {
    id: "apartments",
    name: "Apartments",
    kind: "house",
    emoji: "🏢",
    coins: 2800,
    materials: { mat_plank: 12, mat_nail: 16, mat_bolt: 5 },
    unlockLevel: 10,
    population: 14,
    xp: 120,
  },
  // --- Community (unique, gate reputation) ------------------------------
  {
    id: "town_hall",
    name: "Town Hall",
    kind: "community",
    emoji: "🏛️",
    coins: 300,
    materials: { mat_plank: 2 },
    unlockLevel: 2,
    reputation: 10,
    xp: 40,
    maxCount: 1,
  },
  {
    id: "school",
    name: "School",
    kind: "community",
    emoji: "🏫",
    coins: 700,
    materials: { mat_plank: 5, mat_nail: 6 },
    unlockLevel: 4,
    reputation: 15,
    xp: 60,
    maxCount: 1,
  },
  {
    id: "clinic",
    name: "Clinic",
    kind: "community",
    emoji: "🏥",
    coins: 1200,
    materials: { mat_plank: 8, mat_nail: 10, mat_bolt: 3 },
    unlockLevel: 6,
    reputation: 20,
    xp: 90,
    maxCount: 1,
  },
  {
    id: "cinema",
    name: "Cinema",
    kind: "community",
    emoji: "🎬",
    coins: 2000,
    materials: { mat_plank: 10, mat_nail: 12, mat_bolt: 4 },
    unlockLevel: 8,
    reputation: 25,
    xp: 130,
    maxCount: 1,
  },
  {
    id: "restaurant",
    name: "Restaurant",
    kind: "community",
    emoji: "🍽️",
    coins: 2600,
    materials: { mat_plank: 12, mat_nail: 14, mat_bolt: 5 },
    unlockLevel: 9,
    reputation: 28,
    xp: 150,
    maxCount: 1,
  },
  {
    id: "gym",
    name: "Gym",
    kind: "community",
    emoji: "🏟️",
    coins: 3400,
    materials: { mat_plank: 14, mat_nail: 18, mat_bolt: 6 },
    unlockLevel: 11,
    reputation: 32,
    xp: 180,
    maxCount: 1,
  },
  // --- Decorations (small reputation, cosmetic) -------------------------
  {
    id: "flowerbed",
    name: "Flower Bed",
    kind: "decoration",
    emoji: "🌷",
    coins: 60,
    materials: {},
    unlockLevel: 1,
    reputation: 1,
    xp: 3,
  },
  {
    id: "bench",
    name: "Park Bench",
    kind: "decoration",
    emoji: "🪑",
    coins: 90,
    materials: {},
    unlockLevel: 2,
    reputation: 1,
    xp: 3,
  },
  {
    id: "lamppost",
    name: "Lamppost",
    kind: "decoration",
    emoji: "🏮",
    coins: 150,
    materials: { mat_nail: 1 },
    unlockLevel: 3,
    reputation: 2,
    xp: 5,
  },
  {
    id: "fountain",
    name: "Fountain",
    kind: "decoration",
    emoji: "⛲",
    coins: 450,
    materials: { mat_plank: 2, mat_nail: 2 },
    unlockLevel: 5,
    reputation: 4,
    xp: 12,
  },
  {
    id: "statue",
    name: "Statue",
    kind: "decoration",
    emoji: "🗿",
    coins: 900,
    materials: { mat_plank: 3, mat_bolt: 2 },
    unlockLevel: 7,
    reputation: 6,
    xp: 20,
  },
];

export const BUILDINGS: Record<string, BuildingDef> = Object.fromEntries(
  BUILDING_LIST.map((b) => [b.id, b]),
);

export function getBuilding(id: string): BuildingDef | undefined {
  return BUILDINGS[id];
}

export function buildingsUnlockedAt(level: number): BuildingDef[] {
  return BUILDING_LIST.filter((b) => b.unlockLevel <= level);
}
