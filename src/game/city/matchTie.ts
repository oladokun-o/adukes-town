import { depositCoins } from "@/game/city/cityActions";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { computeLevelWinReward, LOSS_CONSOLATION_COINS } from "@/game/city/rewards";
import type { CityState } from "@/game/city/types";
import { GameEvents, onGameEvent } from "@/game/events";

function awardCoins(levelId: string, amount: number): void {
  const withCoins = depositCoins(getCityState(), amount);
  const next: CityState = { ...withCoins, lastPlayedLevelId: levelId };
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

// Couples match-3 results to the city — the only module that does. Neither
// BoardScene nor the city logic/UI layers know about each other directly;
// they only share the event bus.
export function initMatchCoinTie(): void {
  onGameEvent(GameEvents.LevelWin, (payload) => {
    awardCoins(payload.levelId, computeLevelWinReward(payload.movesRemaining));
  });
  onGameEvent(GameEvents.LevelLose, (payload) => {
    awardCoins(payload.levelId, LOSS_CONSOLATION_COINS);
  });
}
