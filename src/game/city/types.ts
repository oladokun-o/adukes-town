import { generateOrder, PLOT_LAYOUT, STARTING_BARN_CAPACITY } from "@/game/city/catalog";
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

export interface CityState {
  coins: number;
  xp: number;
  level: number;
  barnCapacity: number;
  inventory: Record<ItemId, number>;
  plots: PlotState[];
  // Keyed by factoryId, created lazily on first use. Which factories are
  // *available* is derived from `level` (factoriesUnlockedAt), not stored.
  factories: Record<string, FactoryRuntime>;
  // Keyed by penId, created lazily on first feed. Available pens derive
  // from `level` (animalPensUnlockedAt).
  animals: Record<string, AnimalPenRuntime>;
  orders: OrderState[];
  lastPlayedLevelId: string | null;
}

// Envelope version for the persisted city blob (see cityState.ts).
// Distinct from SaveBundle's SCHEMA_VERSION but bumped in lockstep.
export const CITY_SCHEMA_VERSION = 4;

function firstOrder(): OrderState {
  const seed = 1;
  const spec = generateOrder(seed, 1);
  return { id: `order-${seed}`, seed, ...spec };
}

export function createDefaultCityState(): CityState {
  return {
    coins: 0,
    xp: 0,
    level: 1,
    barnCapacity: STARTING_BARN_CAPACITY,
    // A handful of starter seeds so the farm loop turns before the first
    // match-3 or order payout.
    inventory: { seed_wheat: 8 },
    plots: PLOT_LAYOUT.map((id, index) => ({ id, unlocked: index === 0, planting: null })),
    factories: {},
    animals: {},
    orders: [firstOrder()],
    lastPlayedLevelId: null,
  };
}
