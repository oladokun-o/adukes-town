export interface Timer {
  startedAt: number;
  readyAt: number;
}

export interface PlotState {
  id: string;
  unlocked: boolean;
  crop: Timer | null;
}

export interface FactoryState {
  batch: Timer | null;
}

export interface CityState {
  coins: number;
  plots: PlotState[];
  cropInventory: number;
  factory: FactoryState;
  goodsInventory: number;
  lastPlayedLevelId: string | null;
}

// Tunable economy constants for the city loop — starting values, expect to
// retune once this is actually played.
export const CROP_GROW_MS = 60_000;
export const FACTORY_PRODUCE_MS = 90_000;
export const CROPS_PER_FACTORY_BATCH = 3;
export const GOODS_PER_FACTORY_BATCH = 1;
export const GOODS_PER_ORDER = 2;
export const COINS_PER_ORDER = 25;

// The farm grid's starting size — not a hard cap. Grid position (col/row) is
// derived from a plot's index, not stored, so growing the farm later is just
// raising these two numbers (see src/game/town/layout.ts).
export const FARM_GRID_WIDTH = 6;
export const FARM_GRID_HEIGHT = 6;
export const FARM_PLOT_COUNT = FARM_GRID_WIDTH * FARM_GRID_HEIGHT;

const BASE_PLOT_UNLOCK_COST = 50;
const PLOT_UNLOCK_COST_STEP = 25;

// Each already-unlocked plot makes the next one pricier — replaces the old
// single flat EXPAND_SECOND_PLOT_COST now that the farm isn't fixed at 2.
export function plotUnlockCost(unlockedCount: number): number {
  return BASE_PLOT_UNLOCK_COST + PLOT_UNLOCK_COST_STEP * (unlockedCount - 1);
}

export function createDefaultCityState(): CityState {
  const plots: PlotState[] = Array.from({ length: FARM_PLOT_COUNT }, (_, i) => ({
    id: `plot-${i + 1}`,
    unlocked: i === 0,
    crop: null,
  }));
  return {
    coins: 0,
    plots,
    cropInventory: 0,
    factory: { batch: null },
    goodsInventory: 0,
    lastPlayedLevelId: null,
  };
}
