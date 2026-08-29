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
import { armBoosters } from "@/game/city/cityActions";
import { currentLives, msToNextLife } from "@/game/city/lives";
import { MAX_LIVES } from "@/game/city/catalog";
import {
  buildHabitat,
  claimAchievement,
  claimDailyBonus,
  collectShip,
  digMine,
  loadShip,
  popBalloon,
  rushCrop,
  rushFactory,
  rushPen,
} from "@/game/city/deepEconomyActions";
import {
  balloonReady,
  claimableAchievements,
  dailyAvailable,
  nextHabitat,
} from "@/game/city/deepEconomy";
import { shipRemainingMs } from "@/game/city/transport";
import {
  celebrateFestival,
  celebratableFestivals,
  pendingRemembers,
  rememberFact,
  repairSetback,
  talkTo,
  totalHearts,
  type CharacterId,
} from "@/game/story";
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
import { buyPicks, buySeed, sellItem } from "@/game/city/market";
import { getCrop, getItem } from "@/game/city/catalog";
import { getProfile } from "@/game/story";
import { pushToast } from "@/city/toasts";
import type { CityState } from "@/game/city/types";
import { xpIntoLevel } from "@/game/city/xp";

// The only Svelte-aware file that touches the city logic layer — every
// button in the UI dispatches through here. cityState.ts is the source of
// truth: this store just mirrors it, via onCityStateChange, so it also picks
// up coin/XP deposits from matchTie.ts (which never touches Svelte directly).
export const cityState = writable<CityState>(getCityState());

// Watch every state change (from here OR matchTie.ts) for the milestones
// worth celebrating with a toast — level-ups and full relationship hearts —
// regardless of which action or reward path caused them.
let lastSeen = getCityState();
onCityStateChange((next) => {
  if (next.level > lastSeen.level) {
    pushToast(`Level ${next.level}!`, "level", "⭐");
  }
  lastSeen = next;
  cityState.set(next);
});

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

// Phase 6 meta layer. `now` is read once per tick by callers that need it;
// these are cheap re-derivations on every state change.
export const deep = derived(cityState, (s) => {
  const now = Date.now();
  return {
    tokens: s.tokens,
    picks: s.mine.picks,
    mineDepth: s.mine.depth,
    claimable: claimableAchievements(s).length,
    dailyAvailable: dailyAvailable(s, now),
    dailyStreak: s.daily.streak,
    balloonReady: balloonReady(s, now),
    nextHabitat: nextHabitat(s),
    zooBuilt: s.zoo.length,
    shipDeparted: s.harbor.departedAt !== null,
    shipRemainingMs: shipRemainingMs(s.harbor, now),
    lives: currentLives(s, now),
    maxLives: MAX_LIVES,
    msToNextLife: msToNextLife(s, now),
    boosterCharges: s.boosterCharges,
  };
});

export const story = derived(cityState, (s) => {
  const now = Date.now();
  return {
    hearts: totalHearts(s),
    pendingRemembers: pendingRemembers(s),
    activeSetback: s.story.activeSetback,
    festivals: celebratableFestivals(s, now),
  };
});

// Runs a guarded action and persists if it changed anything. `onApplied`
// (when given) fires with the before/after states so a caller can raise a
// toast describing what happened — it never runs on a no-op.
function dispatch(
  action: (state: CityState, now: number) => CityState,
  onApplied?: (before: CityState, after: CityState) => void,
): void {
  const state = getCityState();
  const next = action(state, Date.now());
  if (next === state) return;
  onApplied?.(state, next);
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

function coinDelta(before: CityState, after: CityState): number {
  return after.coins - before.coins;
}

export function plant(plotId: string, cropId: string): void {
  dispatch((state, now) => plantCrop(state, plotId, cropId, now));
}

export function harvest(plotId: string): void {
  dispatch(
    (state, now) => harvestPlot(state, plotId, now),
    (before) => {
      const plot = before.plots.find((p) => p.id === plotId);
      const crop = plot?.planting ? getCrop(plot.planting.cropId) : undefined;
      if (crop) {
        const item = getItem(crop.producesItemId);
        pushToast(`+${crop.yield} ${item?.name ?? "crop"}`, "reward", item?.icon ?? "🧺");
      }
    },
  );
}

export function queueRecipeAction(factoryId: string, recipeId: string): void {
  dispatch((state, now) => queueRecipe(state, factoryId, recipeId, now));
}

export function collectFactoryAction(factoryId: string): void {
  dispatch(
    (state, now) => collectFactory(state, factoryId, now),
    () => pushToast("Goods collected", "reward", "📦"),
  );
}

export function feedPenAction(penId: string): void {
  dispatch((state, now) => feedPen(state, penId, now));
}

export function collectPenAction(penId: string): void {
  dispatch(
    (state, now) => collectPen(state, penId, now),
    () => pushToast("Animal produce collected", "reward", "🥚"),
  );
}

export function fulfill(orderId: string): void {
  dispatch(
    (state) => fulfillOrder(state, orderId),
    (before, after) => pushToast(`Order filled · +${coinDelta(before, after)} 🪙`, "reward", "🚁"),
  );
}

export function rerollOrderAction(orderId: string): void {
  dispatch((state) => rerollOrder(state, orderId));
}

export function loadWagonAction(index: number): void {
  dispatch((state, now) => loadWagon(state, index, now));
}

export function collectTrainAction(): void {
  dispatch(
    (state, now) => collectTrain(state, now),
    () => pushToast("The train is back with materials", "reward", "🚂"),
  );
}

export function loadPlaneAction(): void {
  dispatch((state, now) => loadPlane(state, now));
}

export function collectPlaneAction(): void {
  dispatch(
    (state, now) => collectPlane(state, now),
    () => pushToast("The plane has landed", "reward", "✈️"),
  );
}

export function upgradeBarnAction(): void {
  dispatch((state) => upgradeBarn(state));
}

export function buyPlotAction(plotId: string): void {
  dispatch((state) => buyPlot(state, plotId));
}

export function buildStructureAction(buildingId: string): void {
  dispatch(
    (state) => buildStructure(state, buildingId),
    () => pushToast("New building raised", "reward", "🏗️"),
  );
}

export function expandTownAction(): void {
  dispatch(
    (state) => expandTown(state),
    () => pushToast("Land expanded", "reward", "🧱"),
  );
}

export function buySeedAction(cropId: string, qty: number): void {
  dispatch((state) => buySeed(state, cropId, qty));
}

export function sellItemAction(itemId: string, qty: number): void {
  dispatch((state) => sellItem(state, itemId, qty));
}

// --- Phase 6 -------------------------------------------------------

export function rushCropAction(plotId: string): void {
  dispatch((state, now) => rushCrop(state, plotId, now));
}

export function rushFactoryAction(factoryId: string): void {
  dispatch((state, now) => rushFactory(state, factoryId, now));
}

export function rushPenAction(penId: string): void {
  dispatch((state, now) => rushPen(state, penId, now));
}

export function digMineAction(): void {
  dispatch(
    (state) => digMine(state),
    (before, after) => {
      const gotToken = after.tokens > before.tokens;
      pushToast(gotToken ? "A gem! +1 💠" : "Struck materials", "reward", gotToken ? "💎" : "⛏️");
    },
  );
}

export function buyPicksAction(qty: number): void {
  dispatch((state) => buyPicks(state, qty));
}

export function buildHabitatAction(habitatId: string): void {
  dispatch(
    (state) => buildHabitat(state, habitatId),
    () => pushToast("New zoo habitat opened", "reward", "🦁"),
  );
}

export function loadShipAction(): void {
  dispatch((state, now) => loadShip(state, now));
}

export function collectShipAction(): void {
  dispatch(
    (state, now) => collectShip(state, now),
    () => pushToast("The ship returned from the islands", "reward", "⚓"),
  );
}

export function claimAchievementAction(id: string): void {
  dispatch(
    (state) => claimAchievement(state, id),
    () => pushToast("Achievement claimed", "reward", "🏆"),
  );
}

export function claimDailyAction(): void {
  dispatch(
    (state, now) => claimDailyBonus(state, now),
    (before, after) => {
      pushToast(`Daily bonus · +${coinDelta(before, after)} 🪙`, "reward", "🎁");
      if (after.story.activeSetback && !before.story.activeSetback) {
        pushToast(after.story.activeSetback.label, "warn", "🌧️");
      }
    },
  );
}

export function popBalloonAction(): void {
  dispatch(
    (state, now) => popBalloon(state, now),
    () => pushToast("Gift balloon popped!", "reward", "🎈"),
  );
}

export function armBoostersAction(boosterIds: readonly string[]): void {
  dispatch((state) => armBoosters(state, boosterIds));
}

// --- Phase 8: narrative ------------------------------------------

export function talkToAction(id: CharacterId): void {
  dispatch((state) => talkTo(state, id));
}

export function rememberFactAction(id: CharacterId, factId: string): void {
  dispatch(
    (state) => rememberFact(state, id, factId),
    () => pushToast(`${getProfile(id).name} won't forget that`, "story", getProfile(id).emoji),
  );
}

export function celebrateFestivalAction(festivalId: string): void {
  dispatch(
    (state, now) => celebrateFestival(state, festivalId, now),
    () => pushToast("Festival celebrated 🎉", "story", "🎊"),
  );
}

export function repairSetbackAction(): void {
  dispatch(
    (state) => repairSetback(state),
    () => pushToast("Repaired — the town bounces back", "story", "🛠️"),
  );
}
