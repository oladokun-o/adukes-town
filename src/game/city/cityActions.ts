import {
  generateOrder,
  getAnimalPen,
  getCrop,
  getRecipe,
  penFeedCost,
  penYield,
  PLOT_COSTS,
  PLOT_UNLOCK_LEVEL,
} from "@/game/city/catalog";
import { addItems, barnFree, hasItems, removeItems } from "@/game/city/barn";
import { isPenReady } from "@/game/city/animals";
import { emptyFactory, QUEUE_CAPACITY, settleFactory } from "@/game/city/factory";
import { isReady, startTimer } from "@/game/city/timers";
import type { CityState, FactoryRuntime, OrderState, PlotState } from "@/game/city/types";
import { applyXpGain } from "@/game/city/xp";

// Every action here is a guarded, pure state transition: an invalid call
// (locked plot, timer not ready, insufficient resources, barn full, content
// not yet unlocked) returns the state unchanged *by reference* rather than
// throwing — a stray click should be a no-op, not a crash. Callers rely on
// `next === state` to skip a redundant save.
//
// XP gains are applied *inside* the action, on the already-updated state, so
// a harvest/collect/fulfil that triggers a level-up bumps barnCapacity in
// the same transition.

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

function withFactory(
  state: CityState,
  factoryId: string,
  update: (factory: FactoryRuntime) => FactoryRuntime,
): CityState {
  const current = state.factories[factoryId] ?? emptyFactory();
  return {
    ...state,
    factories: { ...state.factories, [factoryId]: update(current) },
  };
}

export function plantCrop(
  state: CityState,
  plotId: string,
  cropId: string,
  now: number,
): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || !plot.unlocked || plot.planting !== null) return state;
  const crop = getCrop(cropId);
  if (!crop || crop.unlockLevel > state.level) return state;
  // Planting consumes one seed — buy them from the market (market.ts).
  if (!hasItems(state.inventory, { [crop.seedItemId]: 1 })) return state;
  const planted = withPlot(state, plotId, (p) => ({
    ...p,
    planting: { cropId, timer: startTimer(now, crop.growMs) },
  }));
  return { ...planted, inventory: removeItems(planted.inventory, crop.seedItemId, 1) };
}

export function harvestPlot(state: CityState, plotId: string, now: number): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.planting === null || !isReady(plot.planting.timer, now)) return state;
  const crop = getCrop(plot.planting.cropId);
  if (!crop || barnFree(state) < crop.yield) return state;
  const cleared = withPlot(state, plotId, (p) => ({ ...p, planting: null }));
  const stored: CityState = {
    ...cleared,
    inventory: addItems(cleared.inventory, crop.producesItemId, crop.yield),
  };
  return applyXpGain(stored, crop.xp);
}

// Queue a recipe. Inputs are consumed immediately (Township-style); the
// slot cooks when it reaches the front of the queue.
export function queueRecipe(
  state: CityState,
  factoryId: string,
  recipeId: string,
  now: number,
): CityState {
  const recipe = getRecipe(recipeId);
  if (!recipe || recipe.factoryId !== factoryId || recipe.unlockLevel > state.level) return state;
  const factory = state.factories[factoryId] ?? emptyFactory();
  if (factory.queue.length >= QUEUE_CAPACITY) return state;
  if (!hasItems(state.inventory, recipe.inputs)) return state;

  let inventory = state.inventory;
  for (const [id, qty] of Object.entries(recipe.inputs)) {
    inventory = removeItems(inventory, id, qty);
  }
  return withFactory({ ...state, inventory }, factoryId, (f) => ({
    queue: [...f.queue, recipeId],
    startedAt: f.queue.length === 0 ? now : f.startedAt,
  }));
}

// Collect every finished slot at once (all-or-nothing: if the barn can't
// fit the whole batch of finished outputs, it's a no-op — sell something
// first). Removing the finished slots slides the queue forward; the next
// slot's clock is already running via the absolute timestamp.
export function collectFactory(state: CityState, factoryId: string, now: number): CityState {
  const factory = state.factories[factoryId];
  if (!factory) return state;
  const { done, remaining, remainingStartedAt } = settleFactory(factory, now);
  if (done.length === 0) return state;

  let inventory = state.inventory;
  let totalOut = 0;
  let xp = 0;
  for (const recipeId of done) {
    const recipe = getRecipe(recipeId);
    if (!recipe) continue;
    totalOut += recipe.outputQty;
    xp += recipe.xp;
  }
  if (barnFree(state) < totalOut) return state;

  for (const recipeId of done) {
    const recipe = getRecipe(recipeId);
    if (recipe) inventory = addItems(inventory, recipe.outputItemId, recipe.outputQty);
  }

  const stored: CityState = {
    ...state,
    inventory,
    factories: {
      ...state.factories,
      [factoryId]: { queue: remaining, startedAt: remainingStartedAt },
    },
  };
  return applyXpGain(stored, xp);
}

function nextOrderFor(state: CityState): OrderState {
  const seed = state.orders.reduce((max, o) => Math.max(max, o.seed), 0) + 1;
  return { id: `order-${seed}`, seed, ...generateOrder(seed, state.level) };
}

export function fulfillOrder(state: CityState, orderId: string): CityState {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || !hasItems(state.inventory, order.requires)) return state;

  let inventory = state.inventory;
  for (const [id, qty] of Object.entries(order.requires)) {
    inventory = removeItems(inventory, id, qty);
  }
  const replacement = nextOrderFor(state);
  const stored: CityState = {
    ...state,
    inventory,
    coins: state.coins + order.rewardCoins,
    orders: [...state.orders.filter((o) => o.id !== orderId), replacement],
  };
  return applyXpGain(stored, order.rewardXp);
}

// Feed a whole animal pen: costs feed per animal, starts one produce cycle.
export function feedPen(state: CityState, penId: string, now: number): CityState {
  const pen = getAnimalPen(penId);
  if (!pen || pen.unlockLevel > state.level) return state;
  const runtime = state.animals[penId];
  if (runtime?.startedAt != null) return state; // already fed / cooking
  const cost = penFeedCost(pen);
  if (!hasItems(state.inventory, { [pen.feedItemId]: cost })) return state;
  return {
    ...state,
    inventory: removeItems(state.inventory, pen.feedItemId, cost),
    animals: { ...state.animals, [penId]: { startedAt: now } },
  };
}

// Collect a pen's produce once the cycle is done.
export function collectPen(state: CityState, penId: string, now: number): CityState {
  const pen = getAnimalPen(penId);
  const runtime = state.animals[penId];
  if (!pen || !runtime || !isPenReady(penId, runtime, now)) return state;
  const yielded = penYield(pen);
  if (barnFree(state) < yielded) return state;
  const stored: CityState = {
    ...state,
    inventory: addItems(state.inventory, pen.producesItemId, yielded),
    animals: { ...state.animals, [penId]: { startedAt: null } },
  };
  return applyXpGain(stored, pen.xp);
}

export function buyPlot(state: CityState, plotId: string): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.unlocked) return state;
  const cost = PLOT_COSTS[plotId];
  if (cost === undefined || state.coins < cost) return state;
  if ((PLOT_UNLOCK_LEVEL[plotId] ?? 1) > state.level) return state;
  return {
    ...withPlot(state, plotId, (p) => ({ ...p, unlocked: true })),
    coins: state.coins - cost,
  };
}

export function depositCoins(state: CityState, amount: number): CityState {
  if (amount <= 0) return state;
  return { ...state, coins: state.coins + amount };
}
