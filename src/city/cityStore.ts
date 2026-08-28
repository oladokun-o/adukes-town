import { derived, writable } from "svelte/store";
import {
  buyPlot,
  collectFactoryBatch,
  fulfillOrder,
  harvestPlot,
  plantCrop,
  startFactoryBatch,
} from "@/game/city/cityActions";
import { barnUsed } from "@/game/city/barn";
import { getCityState, onCityStateChange, storeCityState } from "@/game/city/cityState";
import type { CityState } from "@/game/city/types";
import { xpIntoLevel } from "@/game/city/xp";

// The only Svelte-aware file that touches the city logic layer — every
// button in the UI dispatches through here. cityState.ts is the source of
// truth: this store just mirrors it, via onCityStateChange, so it also picks
// up coin/XP deposits from matchTie.ts (which never touches Svelte directly).
export const cityState = writable<CityState>(getCityState());
onCityStateChange((next) => cityState.set(next));

export const barn = derived(cityState, (s) => ({
  used: barnUsed(s.inventory),
  capacity: s.barnCapacity,
}));

export const xpMeter = derived(cityState, (s) => ({ level: s.level, ...xpIntoLevel(s.xp) }));

function dispatch(action: (state: CityState, now: number) => CityState): void {
  const state = getCityState();
  const next = action(state, Date.now());
  if (next === state) return;
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

// Phase 0 keeps the UI single-crop: cropId / recipeId default to the only
// content that exists. Phase 1 threads real ids through from the pickers.
export function plant(plotId: string, cropId = "wheat"): void {
  dispatch((state, now) => plantCrop(state, plotId, cropId, now));
}

export function harvest(plotId: string): void {
  dispatch((state, now) => harvestPlot(state, plotId, now));
}

export function startFactory(factoryId: string, recipeId = "bread"): void {
  dispatch((state, now) => startFactoryBatch(state, factoryId, recipeId, now));
}

export function collectFactory(factoryId: string): void {
  dispatch((state, now) => collectFactoryBatch(state, factoryId, now));
}

export function fulfill(orderId: string): void {
  dispatch((state) => fulfillOrder(state, orderId));
}

export function buyPlotAction(plotId: string): void {
  dispatch((state) => buyPlot(state, plotId));
}
