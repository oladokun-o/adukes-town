import { describe, expect, it } from "vitest";
import { allBoosters, BOOSTERS, loadoutCost, resolveBoosterModifiers } from "@/game/city/catalog";
import { armBoosters } from "@/game/city/cityActions";
import {
  BASE_WIN_COINS,
  COINS_PER_MOVE_LEFT,
  matchLossBundle,
  matchWinBundle,
  wantedItems,
  WIN_GOODS_QTY,
} from "@/game/city/matchRewards";
import { createDefaultCityState, type CityState, type OrderState } from "@/game/city/types";

function order(requires: Record<string, number>): OrderState {
  return { id: "o", seed: 1, requires, rewardCoins: 1, rewardXp: 1 };
}

describe("matchWinBundle", () => {
  it("scales coins with moves left and always pays picks + a booster charge", () => {
    const s = createDefaultCityState();
    const b = matchWinBundle(s, 4, 1);
    expect(b.coins).toBe(BASE_WIN_COINS + 4 * COINS_PER_MOVE_LEFT);
    expect(b.picks).toBe(1);
    expect(b.boosterCharges).toBe(1);
    expect(b.xp).toBeGreaterThan(0);
  });

  it("drops a good the city currently wants, when there's barn room", () => {
    const s: CityState = {
      ...createDefaultCityState(),
      orders: [order({ good_bread: 5 })],
      barnCapacity: 100,
    };
    const b = matchWinBundle(s, 0, 7);
    expect(b.goods).toEqual({ good_bread: WIN_GOODS_QTY });
  });

  it("skips goods when the barn is full", () => {
    const s: CityState = {
      ...createDefaultCityState(),
      orders: [order({ good_bread: 5 })],
      barnCapacity: 8, // exactly the starter seeds, no room
    };
    expect(matchWinBundle(s, 0, 7).goods).toEqual({});
  });
});

describe("wantedItems", () => {
  it("collects goods from orders / train / plane / harbor, deduped and sorted", () => {
    const s: CityState = {
      ...createDefaultCityState(),
      orders: [order({ good_bread: 1, crop_wheat: 3 })],
    };
    const wanted = wantedItems(s);
    expect(wanted).toContain("good_bread");
    expect(wanted).not.toContain("crop_wheat"); // crops aren't "goods"
    expect([...wanted]).toEqual([...wanted].sort());
  });
});

describe("matchLossBundle", () => {
  it("is non-zero (no pure-loss state) but grants no picks/charges/goods", () => {
    const b = matchLossBundle();
    expect(b.coins).toBeGreaterThan(0);
    expect(b.xp).toBeGreaterThan(0);
    expect(b.picks).toBe(0);
    expect(b.boosterCharges).toBe(0);
    expect(b.goods).toEqual({});
  });
});

describe("boosters", () => {
  it("catalog keys match ids", () => {
    for (const [k, d] of Object.entries(BOOSTERS)) expect(d.id).toBe(k);
  });

  it("resolveBoosterModifiers folds a loadout into a board-effect bag", () => {
    const ids = allBoosters().map((b) => b.id);
    const mods = resolveBoosterModifiers(ids);
    expect(mods.extraMoves).toBe(5);
    expect(mods.headStart).toBe(3);
    expect(mods.startRainbow).toBe(1);
  });

  it("armBoosters spends charges only when affordable", () => {
    const withCharges: CityState = { ...createDefaultCityState(), boosterCharges: 10 };
    const ids = ["extra_moves", "head_start"];
    const cost = loadoutCost(ids);
    expect(armBoosters(withCharges, ids).boosterCharges).toBe(10 - cost);

    const broke: CityState = { ...createDefaultCityState(), boosterCharges: 1 };
    expect(armBoosters(broke, ids)).toBe(broke);
    expect(armBoosters(withCharges, [])).toBe(withCharges);
  });
});
