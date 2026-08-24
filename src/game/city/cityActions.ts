import {
  COINS_PER_ORDER,
  CROP_GROW_MS,
  CROPS_PER_FACTORY_BATCH,
  FACTORY_PRODUCE_MS,
  GOODS_PER_FACTORY_BATCH,
  GOODS_PER_ORDER,
  plotUnlockCost,
  type CityState,
  type PlotState,
} from "@/game/city/types";
import { isReady, startTimer } from "@/game/city/timers";

// Every action here is a guarded, pure state transition: an invalid call
// (locked plot, timer not ready, insufficient resources) returns the state
// unchanged rather than throwing — a stray click should be a no-op, not a
// crash, matching the project's "no punishing dead ends" design principle.

function withPlot(
  state: CityState,
  plotId: string,
  update: (plot: PlotState) => PlotState,
): CityState {
  return {
    ...state,
    plots: state.plots.map((plot) => (plot.id === plotId ? update(plot) : plot)),
  };
}

export function plantCrop(state: CityState, plotId: string, now: number): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || !plot.unlocked || plot.crop !== null) return state;
  return withPlot(state, plotId, (p) => ({ ...p, crop: startTimer(now, CROP_GROW_MS) }));
}

export function harvestPlot(state: CityState, plotId: string, now: number): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || !isReady(plot.crop, now)) return state;
  return {
    ...withPlot(state, plotId, (p) => ({ ...p, crop: null })),
    cropInventory: state.cropInventory + 1,
  };
}

export function startFactoryBatch(state: CityState, now: number): CityState {
  if (state.factory.batch !== null || state.cropInventory < CROPS_PER_FACTORY_BATCH) return state;
  return {
    ...state,
    cropInventory: state.cropInventory - CROPS_PER_FACTORY_BATCH,
    factory: { batch: startTimer(now, FACTORY_PRODUCE_MS) },
  };
}

export function collectFactoryBatch(state: CityState, now: number): CityState {
  if (!isReady(state.factory.batch, now)) return state;
  return {
    ...state,
    factory: { batch: null },
    goodsInventory: state.goodsInventory + GOODS_PER_FACTORY_BATCH,
  };
}

export function fulfillOrder(state: CityState): CityState {
  if (state.goodsInventory < GOODS_PER_ORDER) return state;
  return {
    ...state,
    goodsInventory: state.goodsInventory - GOODS_PER_ORDER,
    coins: state.coins + COINS_PER_ORDER,
  };
}

export function unlockPlot(state: CityState, plotId: string): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.unlocked) return state;
  const unlockedCount = state.plots.filter((p) => p.unlocked).length;
  const cost = plotUnlockCost(unlockedCount);
  if (state.coins < cost) return state;
  return {
    ...withPlot(state, plotId, (p) => ({ ...p, unlocked: true })),
    coins: state.coins - cost,
  };
}

export function depositCoins(state: CityState, amount: number): CityState {
  return { ...state, coins: state.coins + amount };
}
