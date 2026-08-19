import { describe, expect, it } from "vitest";
import {
  BASE_LEVEL_WIN_COINS,
  BONUS_COINS_PER_MOVE_REMAINING,
  computeLevelWinReward,
} from "@/game/city/rewards";

describe("computeLevelWinReward", () => {
  it("pays just the base amount with zero moves remaining", () => {
    expect(computeLevelWinReward(0)).toBe(BASE_LEVEL_WIN_COINS);
  });

  it("adds a bonus per move remaining", () => {
    expect(computeLevelWinReward(5)).toBe(
      BASE_LEVEL_WIN_COINS + 5 * BONUS_COINS_PER_MOVE_REMAINING,
    );
  });
});
