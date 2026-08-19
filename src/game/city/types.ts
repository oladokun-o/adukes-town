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

// Tunable economy constants for the minimal Stage 2 loop — starting values,
// expect to retune once this is actually played.
export const CROP_GROW_MS = 60_000;
export const FACTORY_PRODUCE_MS = 90_000;
export const CROPS_PER_FACTORY_BATCH = 3;
export const GOODS_PER_FACTORY_BATCH = 1;
export const GOODS_PER_ORDER = 2;
export const COINS_PER_ORDER = 25;
export const EXPAND_SECOND_PLOT_COST = 50;

export function createDefaultCityState(): CityState {
  return {
    coins: 0,
    plots: [
      { id: "plot-1", unlocked: true, crop: null },
      { id: "plot-2", unlocked: false, crop: null },
    ],
    cropInventory: 0,
    factory: { batch: null },
    goodsInventory: 0,
    lastPlayedLevelId: null,
  };
}
