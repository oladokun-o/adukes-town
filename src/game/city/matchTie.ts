import { addItems, barnFree } from "@/game/city/barn";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { bumpStat } from "@/game/city/cityActions";
import { spendLife } from "@/game/city/lives";
import { matchLossBundle, matchWinBundle, type MatchRewardBundle } from "@/game/city/matchRewards";
import type { CityState } from "@/game/city/types";
import { applyXpGain } from "@/game/city/xp";
import { GameEvents, onGameEvent } from "@/game/events";
import { isRelaxModeEnabled } from "@/settings/relaxMode";

// Couples match-3 results to the city — the only module that does. Neither
// BoardScene nor the city logic/UI layers know about each other directly;
// they only share the event bus.

function applyBundle(state: CityState, bundle: MatchRewardBundle): CityState {
  let next: CityState = {
    ...state,
    coins: state.coins + bundle.coins,
    boosterCharges: state.boosterCharges + bundle.boosterCharges,
    mine: { ...state.mine, picks: state.mine.picks + bundle.picks },
  };
  // Goods only land if the barn can hold them (matchWinBundle already
  // checked, but state may have moved since; be safe).
  let inventory = next.inventory;
  let added = 0;
  for (const [id, qty] of Object.entries(bundle.goods)) {
    if (barnFree({ ...next, inventory }) < qty) break;
    inventory = addItems(inventory, id, qty);
    added += qty;
  }
  if (added > 0) next = { ...next, inventory };
  return applyXpGain(next, bundle.xp);
}

function onWin(levelId: string, movesRemaining: number): void {
  const state = getCityState();
  const bundle = matchWinBundle(state, movesRemaining, hashLevelSeed(levelId, movesRemaining));
  const rewarded = applyBundle(state, bundle);
  const next: CityState = {
    ...bumpStat(rewarded, "match3Wins"),
    lastPlayedLevelId: levelId,
  };
  save(next);
}

function onLose(levelId: string): void {
  const state = getCityState();
  const rewarded = applyBundle(state, matchLossBundle());
  // A loss costs one life — unless relax mode is on, in which case lives
  // are ignored entirely (the "toggle without shame/friction" commitment).
  const lived = isRelaxModeEnabled() ? rewarded : spendLife(rewarded, Date.now());
  save({ ...lived, lastPlayedLevelId: levelId });
}

function save(next: CityState): void {
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

// A stable-ish seed so the "which good do I get" pick is deterministic for
// a given result but varies run to run.
function hashLevelSeed(levelId: string, movesRemaining: number): number {
  let h = movesRemaining * 2654435761;
  for (let i = 0; i < levelId.length; i++) h = (h * 31 + levelId.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function initMatchCoinTie(): void {
  onGameEvent(GameEvents.LevelWin, (payload) => onWin(payload.levelId, payload.movesRemaining));
  onGameEvent(GameEvents.LevelLose, (payload) => onLose(payload.levelId));
}
