import { derived, writable } from "svelte/store";
import {
  buildStructure,
  buyPlot,
  collectFactory,
  collectPen,
  collectPlane,
  collectTrain,
  expandTown,
  feedPen,
  fulfillOrder,
  harvestPlot,
  loadPlane,
  loadWagon,
  plantCrop,
  queueRecipe,
  rerollOrder,
  upgradeBarn,
} from "@/game/city/cityActions";
import { barnUsed } from "@/game/city/barn";
import {
  buildingSlots,
  buildingSlotsFree,
  buildingsPlaced,
  population,
  populationCap,
  townReputation,
} from "@/game/city/town";
import { getCityState, onCityStateChange, storeCityState } from "@/game/city/cityState";
import { buySeed, sellItem } from "@/game/city/market";
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

export const town = derived(cityState, (s) => ({
  population: population(s),
  populationCap: populationCap(s),
  reputation: townReputation(s),
  expansions: s.townExpansions,
  slots: buildingSlots(s),
  slotsFree: buildingSlotsFree(s),
  placed: buildingsPlaced(s),
}));

function dispatch(action: (state: CityState, now: number) => CityState): void {
  const state = getCityState();
  const next = action(state, Date.now());
  if (next === state) return;
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

export function plant(plotId: string, cropId: string): void {
  dispatch((state, now) => plantCrop(state, plotId, cropId, now));
}

export function harvest(plotId: string): void {
  dispatch((state, now) => harvestPlot(state, plotId, now));
}

export function queueRecipeAction(factoryId: string, recipeId: string): void {
  dispatch((state, now) => queueRecipe(state, factoryId, recipeId, now));
}

export function collectFactoryAction(factoryId: string): void {
  dispatch((state, now) => collectFactory(state, factoryId, now));
}

export function feedPenAction(penId: string): void {
  dispatch((state, now) => feedPen(state, penId, now));
}

export function collectPenAction(penId: string): void {
  dispatch((state, now) => collectPen(state, penId, now));
}

export function fulfill(orderId: string): void {
  dispatch((state) => fulfillOrder(state, orderId));
}

export function rerollOrderAction(orderId: string): void {
  dispatch((state) => rerollOrder(state, orderId));
}

export function loadWagonAction(index: number): void {
  dispatch((state, now) => loadWagon(state, index, now));
}

export function collectTrainAction(): void {
  dispatch((state, now) => collectTrain(state, now));
}

export function loadPlaneAction(): void {
  dispatch((state, now) => loadPlane(state, now));
}

export function collectPlaneAction(): void {
  dispatch((state, now) => collectPlane(state, now));
}

export function upgradeBarnAction(): void {
  dispatch((state) => upgradeBarn(state));
}

export function buyPlotAction(plotId: string): void {
  dispatch((state) => buyPlot(state, plotId));
}

export function buildStructureAction(buildingId: string): void {
  dispatch((state) => buildStructure(state, buildingId));
}

export function expandTownAction(): void {
  dispatch((state) => expandTown(state));
}

export function buySeedAction(cropId: string, qty: number): void {
  dispatch((state) => buySeed(state, cropId, qty));
}

export function sellItemAction(itemId: string, qty: number): void {
  dispatch((state) => sellItem(state, itemId, qty));
}
