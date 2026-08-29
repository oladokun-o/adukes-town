import { MATCH_WIN_PICKS } from "@/game/city/catalog";
import { bumpStat, depositCoins } from "@/game/city/cityActions";
import { getCityState, storeCityState } from "@/game/city/cityState";
import {
  computeLevelWinReward,
  LEVEL_LOSS_XP,
  LEVEL_WIN_XP,
  LOSS_CONSOLATION_COINS,
} from "@/game/city/rewards";
import type { CityState } from "@/game/city/types";
import { applyXpGain } from "@/game/city/xp";
import { GameEvents, onGameEvent } from "@/game/events";

function award(levelId: string, coins: number, xp: number, won: boolean): void {
  const withCoins = depositCoins(getCityState(), coins);
  const withXp = applyXpGain(withCoins, xp);
  const withWin = won
    ? bumpStat(
        { ...withXp, mine: { ...withXp.mine, picks: withXp.mine.picks + MATCH_WIN_PICKS } },
        "match3Wins",
      )
    : withXp;
  const next: CityState = { ...withWin, lastPlayedLevelId: levelId };
  storeCityState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}

// Couples match-3 results to the city — the only module that does. Neither
// BoardScene nor the city logic/UI layers know about each other directly;
// they only share the event bus.
export function initMatchCoinTie(): void {
  onGameEvent(GameEvents.LevelWin, (payload) => {
    award(payload.levelId, computeLevelWinReward(payload.movesRemaining), LEVEL_WIN_XP, true);
  });
  onGameEvent(GameEvents.LevelLose, (payload) => {
    award(payload.levelId, LOSS_CONSOLATION_COINS, LEVEL_LOSS_XP, false);
  });
}
