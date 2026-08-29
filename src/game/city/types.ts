import {
  generateOrder,
  generatePlaneManifest,
  generateTrainWagon,
  HELI_BOARD_SIZE,
  PLOT_LAYOUT,
  STARTING_BARN_CAPACITY,
  TRAIN_WAGON_COUNT,
} from "@/game/city/catalog";
import type { ItemId } from "@/game/city/catalog";

export interface Timer {
  startedAt: number;
  readyAt: number;
}

export interface Planting {
  cropId: string;
  timer: Timer;
}

export interface PlotState {
  id: string;
  unlocked: boolean;
  planting: Planting | null;
}

// Per-factory production queue. `queue` holds recipe ids in order; queue[0]
// is cooking and started at `startedAt`. Items whose cumulative cook time
// has elapsed are "done" and wait at the front of the queue until collected
// (they never auto-move to the barn — avoids a surprise barn overflow while
// away). Offline progress falls out of the absolute `startedAt` timestamp,
// no background work needed. See src/game/city/factory.ts.
export interface FactoryRuntime {
  queue: string[];
  startedAt: number | null;
}

// One feed-and-collect cycle per animal pen (no queue). `startedAt` is when
// the pen was last fed; null = not fed / already collected. Offline
// progress falls out of the timestamp. See src/game/city/animals.ts.
export interface AnimalPenRuntime {
  startedAt: number | null;
}

export interface OrderState {
  id: string;
  seed: number;
  requires: Record<ItemId, number>;
  rewardCoins: number;
  rewardXp: number;
}

// A train wagon / plane manifest is just a bundle of required items plus the
// seed it was generated from (so the trip reward is reproducible).
export interface Manifest {
  seed: number;
  requires: Record<ItemId, number>;
}

// `filled` = wagon indices already loaded. When every wagon is loaded the
// train leaves (`departedAt` set); after the trip it returns and the reward
// is collected. `plane` is the same with a single manifest.
export interface TrainState {
  wagons: Manifest[];
  filled: number[];
  departedAt: number | null;
}

export interface PlaneState {
  manifest: Manifest;
  loaded: boolean;
  departedAt: number | null;
}

export interface CityState {
  coins: number;
  xp: number;
  level: number;
  barnCapacity: number;
  // Extra capacity bought via barn upgrades — kept separate so the
  // level-based floor (barnCapacityForLevel) can still raise `barnCapacity`
  // without losing purchased upgrades.
  barnUpgrades: number;
  inventory: Record<ItemId, number>;
  // Building materials from the train — separate map, no barn pressure,
  // not sellable.
  materials: Record<ItemId, number>;
  plots: PlotState[];
  // Keyed by factoryId, created lazily on first use. Which factories are
  // *available* is derived from `level` (factoriesUnlockedAt), not stored.
  factories: Record<string, FactoryRuntime>;
  // Keyed by penId, created lazily on first feed. Available pens derive
  // from `level` (animalPensUnlockedAt).
  animals: Record<string, AnimalPenRuntime>;
  // Helicopter order board — always HELI_BOARD_SIZE entries.
  orders: OrderState[];
  train: TrainState;
  plane: PlaneState;
  // Town layer (Phase 5). `buildings` is buildingId → count placed; which
  // buildings are *available* derives from `level`. `townExpansions` is how
  // many land-expansion slabs have been bought (each adds building slots).
  // Population / reputation are derived (see src/game/city/town.ts), never
  // stored.
  buildings: Record<string, number>;
  townExpansions: number;
  lastPlayedLevelId: string | null;
}

// Envelope version for the persisted city blob (see cityState.ts).
// Distinct from SaveBundle's SCHEMA_VERSION but bumped in lockstep.
export const CITY_SCHEMA_VERSION = 6;

function orderFromSeed(seed: number, level = 1): OrderState {
  return { id: `order-${seed}`, seed, ...generateOrder(seed, level) };
}

export function freshHeliBoard(level = 1, baseSeed = 1): OrderState[] {
  return Array.from({ length: HELI_BOARD_SIZE }, (_, i) => orderFromSeed(baseSeed + i, level));
}

export function freshTrain(level = 1, baseSeed = 1): TrainState {
  return {
    wagons: Array.from({ length: TRAIN_WAGON_COUNT }, (_, i) => ({
      seed: baseSeed + i,
      ...generateTrainWagon(baseSeed + i, level),
    })),
    filled: [],
    departedAt: null,
  };
}

export function freshPlane(level = 1, seed = 1): PlaneState {
  return {
    manifest: { seed, ...generatePlaneManifest(seed, level) },
    loaded: false,
    departedAt: null,
  };
}

export function createDefaultCityState(): CityState {
  return {
    coins: 0,
    xp: 0,
    level: 1,
    barnCapacity: STARTING_BARN_CAPACITY,
    barnUpgrades: 0,
    // A handful of starter seeds so the farm loop turns before the first
    // match-3 or order payout.
    inventory: { seed_wheat: 8 },
    materials: {},
    plots: PLOT_LAYOUT.map((id, index) => ({ id, unlocked: index === 0, planting: null })),
    factories: {},
    animals: {},
    orders: freshHeliBoard(),
    train: freshTrain(),
    plane: freshPlane(),
    buildings: {},
    townExpansions: 0,
    lastPlayedLevelId: null,
  };
}
