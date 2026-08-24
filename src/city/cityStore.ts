import { writable } from "svelte/store";
import {
  collectFactoryBatch,
  fulfillOrder,
  harvestPlot,
  plantCrop,
  startFactoryBatch,
  unlockPlot,
} from "@/game/city/cityActions";
import { getCityState, onCityStateChange, storeCityState } from "@/game/city/cityState";
import type { CityState } from "@/game/city/types";

// The only Svelte-aware file that touches the city logic layer — every
// button in the UI dispatches through here. cityState.ts is the source of
// truth: this store just mirrors it, via onCityStateChange, so it also picks
// up coin deposits from matchTie.ts (which never touches Svelte directly).
export const cityState = writable<CityState>(getCityState());
onCityStateChange((next) => cityState.set(next));

function dispatch(action: (state: CityState, now: number) => CityState): void {
  const state = getCityState();
  const next = action(state, Date.now());
  if (next === state) return;
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

export function plant(plotId: string): void {
  dispatch((state, now) => plantCrop(state, plotId, now));
}

export function harvest(plotId: string): void {
  dispatch((state, now) => harvestPlot(state, plotId, now));
}

export function startFactory(): void {
  dispatch((state, now) => startFactoryBatch(state, now));
}

export function collectFactory(): void {
  dispatch((state, now) => collectFactoryBatch(state, now));
}

export function fulfillOrderAction(): void {
  dispatch((state) => fulfillOrder(state));
}

export function unlockPlotAction(plotId: string): void {
  dispatch((state) => unlockPlot(state, plotId));
}
