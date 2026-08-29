import {
  BALLOON_INTERVAL_MS,
  balloonReward,
  dailyReward,
  dayNumber,
  generateShipManifest,
  getAchievement,
  getAnimalPen,
  getHabitat,
  getRecipe,
  HARBOR_UNLOCK_LEVEL,
  MINE_UNLOCK_LEVEL,
  mineHaul,
  shipReward,
  tokensToRush,
  ZOO_UNLOCK_LEVEL,
} from "@/game/city/catalog";
import { addItems, barnFree, hasItems, removeItems } from "@/game/city/barn";
import { bumpStat } from "@/game/city/cityActions";
import { shipBack } from "@/game/city/transport";
import type { CityState } from "@/game/city/types";
import { applyXpGain } from "@/game/city/xp";

// Phase 6 guarded actions: rushing timers with tokens, the mine, the zoo,
// the harbor ship, achievements, the daily bonus, and gift balloons. Same
// contract as cityActions.ts — an invalid call returns the same state ref.

// --- Rush (spend tokens to finish a timer now) ----------------------

export function rushCrop(state: CityState, plotId: string, now: number): CityState {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot?.planting) return state;
  const remaining = plot.planting.timer.readyAt - now;
  const cost = tokensToRush(remaining);
  if (cost === 0 || state.tokens < cost) return state;
  return {
    ...state,
    tokens: state.tokens - cost,
    plots: state.plots.map((p) =>
      p.id === plotId && p.planting
        ? { ...p, planting: { ...p.planting, timer: { ...p.planting.timer, readyAt: now } } }
        : p,
    ),
  };
}

export function rushFactory(state: CityState, factoryId: string, now: number): CityState {
  const factory = state.factories[factoryId];
  if (!factory || factory.queue.length === 0 || factory.startedAt === null) return state;
  let totalMs = 0;
  for (const recipeId of factory.queue) totalMs += getRecipe(recipeId)?.produceMs ?? 0;
  const remaining = totalMs - (now - factory.startedAt);
  const cost = tokensToRush(remaining);
  if (cost === 0 || state.tokens < cost) return state;
  return {
    ...state,
    tokens: state.tokens - cost,
    factories: { ...state.factories, [factoryId]: { ...factory, startedAt: now - totalMs } },
  };
}

export function rushPen(state: CityState, penId: string, now: number): CityState {
  const pen = getAnimalPen(penId);
  const runtime = state.animals[penId];
  if (!pen || !runtime || runtime.startedAt === null) return state;
  const remaining = runtime.startedAt + pen.produceMs - now;
  const cost = tokensToRush(remaining);
  if (cost === 0 || state.tokens < cost) return state;
  return {
    ...state,
    tokens: state.tokens - cost,
    animals: { ...state.animals, [penId]: { startedAt: now - pen.produceMs } },
  };
}

// --- Mine ---------------------------------------------------------

export function digMine(state: CityState): CityState {
  if (state.level < MINE_UNLOCK_LEVEL || state.mine.picks < 1) return state;
  const haul = mineHaul(state.mine.depth);
  const materials = { ...state.materials };
  for (const [id, qty] of Object.entries(haul.materials)) {
    materials[id] = (materials[id] ?? 0) + qty;
  }
  const stored: CityState = {
    ...state,
    tokens: state.tokens + haul.tokens,
    materials,
    mine: {
      depth: state.mine.depth + 1,
      picks: state.mine.picks - 1 + haul.bonusPicks,
    },
  };
  return applyXpGain(bumpStat(stored, "rocksMined"), haul.xp);
}

// --- Zoo --------------------------------------------------------

export function buildHabitat(state: CityState, habitatId: string): CityState {
  if (state.level < ZOO_UNLOCK_LEVEL) return state;
  const def = getHabitat(habitatId);
  if (!def || state.zoo.includes(habitatId)) return state;
  if (!hasItems(state.inventory, def.goods)) return state;

  let inventory = state.inventory;
  for (const [id, qty] of Object.entries(def.goods)) inventory = removeItems(inventory, id, qty);

  const stored: CityState = {
    ...state,
    inventory,
    coins: state.coins + def.rewardCoins,
    tokens: state.tokens + def.rewardTokens,
    zoo: [...state.zoo, habitatId],
  };
  return bumpStat(stored, "habitatsBuilt");
}

// --- Harbor ship (mirrors the plane, longer trip, pays tokens) -----

export function loadShip(state: CityState, now: number): CityState {
  if (
    state.level < HARBOR_UNLOCK_LEVEL ||
    state.harbor.departedAt !== null ||
    state.harbor.loaded
  ) {
    return state;
  }
  if (!hasItems(state.inventory, state.harbor.manifest.requires)) return state;
  let inventory = state.inventory;
  for (const [id, qty] of Object.entries(state.harbor.manifest.requires)) {
    inventory = removeItems(inventory, id, qty);
  }
  return {
    ...state,
    inventory,
    harbor: { ...state.harbor, loaded: true, departedAt: now },
  };
}

export function collectShip(state: CityState, now: number): CityState {
  if (!shipBack(state.harbor, now)) return state;
  const reward = shipReward(state.harbor.manifest.seed, state.level);
  const seed = state.harbor.manifest.seed + 1;
  const materials = { ...state.materials };
  for (const [id, qty] of Object.entries(reward.materials)) {
    materials[id] = (materials[id] ?? 0) + qty;
  }
  const stored: CityState = {
    ...state,
    materials,
    coins: state.coins + reward.coins,
    tokens: state.tokens + reward.tokens,
    harbor: {
      manifest: { seed, ...generateShipManifest(seed, state.level) },
      loaded: false,
      departedAt: null,
    },
  };
  return applyXpGain(bumpStat(stored, "tripsCompleted"), reward.xp);
}

// --- Achievements -----------------------------------------------

export function claimAchievement(state: CityState, id: string): CityState {
  const def = getAchievement(id);
  if (!def || state.achievements.includes(id)) return state;
  if ((state.stats[def.stat] ?? 0) < def.threshold) return state;
  return {
    ...state,
    coins: state.coins + def.rewardCoins,
    tokens: state.tokens + def.rewardTokens,
    achievements: [...state.achievements, id],
  };
}

// --- Daily bonus + gift balloon --------------------------------

export function claimDailyBonus(state: CityState, now: number): CityState {
  const today = dayNumber(now);
  if (state.daily.lastClaimedDay === today) return state;
  const streak = state.daily.lastClaimedDay === today - 1 ? state.daily.streak + 1 : 1;
  const reward = dailyReward(streak);
  return {
    ...state,
    coins: state.coins + reward.coins,
    tokens: state.tokens + reward.tokens,
    mine: { ...state.mine, picks: state.mine.picks + reward.picks },
    daily: { lastClaimedDay: today, streak },
  };
}

export function popBalloon(state: CityState, now: number): CityState {
  if (now < state.balloon.availableAt) return state;
  const reward = balloonReward(state.balloon.seed);
  const base: CityState = {
    ...state,
    balloon: { availableAt: now + BALLOON_INTERVAL_MS, seed: state.balloon.seed + 1 },
  };
  switch (reward.kind) {
    case "coins":
      return { ...base, coins: base.coins + reward.amount };
    case "token":
      return { ...base, tokens: base.tokens + reward.amount };
    case "pick":
      return { ...base, mine: { ...base.mine, picks: base.mine.picks + reward.amount } };
    case "seed":
      return reward.itemId && barnFree(base) >= reward.amount
        ? { ...base, inventory: addItems(base.inventory, reward.itemId, reward.amount) }
        : { ...base, coins: base.coins + 20 };
  }
}
