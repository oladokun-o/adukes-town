import { FACTORIES, generateOrder, PLOT_LAYOUT, STARTING_BARN_CAPACITY } from "@/game/city/catalog";
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

export interface FactoryBatch {
  recipeId: string;
  timer: Timer;
}

export interface FactoryState {
  id: string;
  batch: FactoryBatch | null;
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
  factories: FactoryState[];
  orders: OrderState[];
  lastPlayedLevelId: string | null;
}

// Envelope version for the persisted city blob (see src/save/cityState.ts).
// Distinct from SaveBundle's SCHEMA_VERSION but bumped in lockstep.
export const CITY_SCHEMA_VERSION = 2;

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
    inventory: {},
    plots: PLOT_LAYOUT.map((id, index) => ({ id, unlocked: index === 0, planting: null })),
    factories: Object.values(FACTORIES)
      .filter((f) => f.unlockLevel <= 1)
      .map((f) => ({ id: f.id, batch: null })),
    orders: [firstOrder()],
    lastPlayedLevelId: null,
  };
}
