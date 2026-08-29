import { MATERIALS, type ItemId } from "@/game/city/catalog/items";
import { mulberry32, orderableItemsAt, pickBundle } from "@/game/city/catalog/orders";

// The transport trio. Helicopter = the steady drip of small orders (a board
// of several). Train = a few larger multi-item wagons; when all are loaded
// it leaves and comes back after a trip with building materials + coins.
// Plane = one big manifest, longest trip, biggest payout. All generation is
// a pure function of (seed, level) — persisted state stores seeds, not the
// derived bundles.

export const HELI_BOARD_SIZE = 6;

export const TRAIN_UNLOCK_LEVEL = 4;
export const TRAIN_WAGON_COUNT = 3;
export const TRAIN_TRIP_MS = 30 * 60_000;

export const PLANE_UNLOCK_LEVEL = 9;
export const PLANE_TRIP_MS = 90 * 60_000;

export interface Bundle {
  requires: Record<ItemId, number>;
}

export interface TransportReward {
  materials: Record<ItemId, number>;
  coins: number;
  xp: number;
}

// The train/plane deliver construction materials; the mine drops the raw
// stone/ore/coal/gem set (see catalog/mine.ts), so keep the reward pool to
// the buildable materials only.
const MINE_ONLY = new Set(["mat_stone", "mat_ore", "mat_coal", "mat_gem"]);
const MATERIAL_IDS = MATERIALS.map((m) => `mat_${m.id}`).filter((id) => !MINE_ONLY.has(id));

function rewardMaterials(
  rand: () => number,
  count: number,
  perMax: number,
): Record<ItemId, number> {
  const shuffled = [...MATERIAL_IDS].sort(() => rand() - 0.5);
  const out: Record<ItemId, number> = {};
  for (const id of shuffled.slice(0, count)) out[id] = 1 + Math.floor(rand() * perMax);
  return out;
}

export function generateTrainWagon(seed: number, level: number): Bundle {
  const { requires } = pickBundle(mulberry32(seed), orderableItemsAt(level), {
    minTypes: 2,
    maxTypes: 3,
    minQty: 3,
    maxQty: 7,
  });
  return { requires };
}

export function trainReward(seed: number, level: number): TransportReward {
  const rand = mulberry32(seed ^ 0x5a5a);
  return {
    materials: rewardMaterials(rand, 3, 2),
    coins: 60 + level * 15,
    xp: 20 + level * 3,
  };
}

export function generatePlaneManifest(seed: number, level: number): Bundle {
  const { requires } = pickBundle(mulberry32(seed), orderableItemsAt(level), {
    minTypes: 4,
    maxTypes: 6,
    minQty: 4,
    maxQty: 9,
  });
  return { requires };
}

export function planeReward(seed: number, level: number): TransportReward {
  const rand = mulberry32(seed ^ 0x3c3c);
  return {
    materials: rewardMaterials(rand, 5, 3),
    coins: 250 + level * 40,
    xp: 80 + level * 8,
  };
}

// Barn upgrades: coins + a rising material cost, each adds a flat slice of
// capacity on top of the level-based floor.
export const BARN_UPGRADE_STEP = 25;

export function barnUpgradeCost(upgradeCount: number): {
  coins: number;
  materials: Record<ItemId, number>;
} {
  const n = upgradeCount + 1;
  return {
    coins: 150 * n,
    materials: {
      mat_nail: 2 + n,
      mat_plank: 1 + Math.ceil(n / 2),
      mat_bolt: Math.ceil(n / 2),
    },
  };
}
