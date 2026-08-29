import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  allAchievements,
  BALLOON_INTERVAL_MS,
  balloonReward,
  dailyReward,
  getHabitat,
  HABITATS,
  HARBOR_UNLOCK_LEVEL,
  MINE_UNLOCK_LEVEL,
  mineHaul,
  PICK_PRICE,
  SHIP_TRIP_MS,
  tokensToRush,
  ZOO_UNLOCK_LEVEL,
} from "@/game/city/catalog";
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
} from "@/game/city/deepEconomyActions";
import { claimableAchievements, zooReputation } from "@/game/city/deepEconomy";
import { buyPicks } from "@/game/city/market";
import { startTimer } from "@/game/city/timers";
import { createDefaultCityState, type CityState } from "@/game/city/types";

function base(extra: Partial<CityState> = {}): CityState {
  return { ...createDefaultCityState(), level: 12, coins: 10_000, ...extra };
}

describe("catalog integrity (phase 6)", () => {
  it("keys match ids", () => {
    for (const [k, d] of Object.entries(ACHIEVEMENTS)) expect(d.id).toBe(k);
    for (const [k, d] of Object.entries(HABITATS)) expect(d.id).toBe(k);
  });

  it("mineHaul is deterministic and always drops something", () => {
    expect(mineHaul(5)).toEqual(mineHaul(5));
    for (let d = 0; d < 30; d++) {
      const h = mineHaul(d);
      expect(Object.keys(h.materials).length).toBeGreaterThan(0);
      expect(h.xp).toBeGreaterThan(0);
    }
  });

  it("tokensToRush is 0 for a finished timer, ≥1 otherwise", () => {
    expect(tokensToRush(0)).toBe(0);
    expect(tokensToRush(-5)).toBe(0);
    expect(tokensToRush(1)).toBe(1);
    expect(tokensToRush(60 * 60_000)).toBe(12);
  });

  it("dailyReward escalates with the streak and caps", () => {
    expect(dailyReward(1).coins).toBeLessThan(dailyReward(5).coins);
    expect(dailyReward(50)).toEqual(dailyReward(7));
  });

  it("balloonReward is deterministic per seed", () => {
    expect(balloonReward(3)).toEqual(balloonReward(3));
  });
});

describe("rush", () => {
  it("rushCrop spends tokens and finishes the crop", () => {
    const s = base({ tokens: 20 });
    const planted = {
      ...s,
      plots: s.plots.map((p, i) =>
        i === 0 ? { ...p, planting: { cropId: "wheat", timer: startTimer(1_000, 600_000) } } : p,
      ),
    };
    const next = rushCrop(planted, "plot-1", 1_000);
    expect(next.tokens).toBeLessThan(20);
    expect(next.plots[0].planting?.timer.readyAt).toBe(1_000);
  });

  it("rushFactory is a no-op without enough tokens", () => {
    const s = base({ tokens: 0, factories: { bakery: { queue: ["bread"], startedAt: 1_000 } } });
    expect(rushFactory(s, "bakery", 1_000)).toBe(s);
  });
});

describe("mine", () => {
  it("digs, spending a pick and awarding loot + xp", () => {
    const s = base({ mine: { depth: 0, picks: 3 } });
    const next = digMine(s);
    expect(next).not.toBe(s);
    expect(next.mine.depth).toBe(1);
    expect(next.mine.picks).toBeLessThanOrEqual(3);
    expect(next.stats.rocksMined).toBe(1);
  });

  it("is a no-op below the unlock level or with no picks", () => {
    expect(digMine(base({ level: MINE_UNLOCK_LEVEL - 1, mine: { depth: 0, picks: 5 } }))).toEqual(
      base({ level: MINE_UNLOCK_LEVEL - 1, mine: { depth: 0, picks: 5 } }),
    );
    const noPicks = base({ mine: { depth: 0, picks: 0 } });
    expect(digMine(noPicks)).toBe(noPicks);
  });

  it("buyPicks trades coins for picks", () => {
    const s = base({ coins: PICK_PRICE * 3, mine: { depth: 0, picks: 1 } });
    const next = buyPicks(s, 3);
    expect(next.mine.picks).toBe(4);
    expect(next.coins).toBe(0);
  });
});

describe("zoo", () => {
  it("builds a habitat, consuming goods and paying coins + tokens + reputation", () => {
    const h = getHabitat("aviary")!;
    const s = base({ inventory: { ...h.goods }, level: ZOO_UNLOCK_LEVEL });
    const next = buildHabitat(s, "aviary");
    expect(next.zoo).toContain("aviary");
    expect(next.coins).toBe(s.coins + h.rewardCoins);
    expect(next.tokens).toBe(h.rewardTokens);
    expect(zooReputation(next)).toBe(h.reputation);
  });

  it("is a no-op when goods are missing or already built", () => {
    const s = base({ level: ZOO_UNLOCK_LEVEL });
    expect(buildHabitat(s, "aviary")).toBe(s);
    const built = base({ zoo: ["aviary"], level: ZOO_UNLOCK_LEVEL });
    expect(buildHabitat(built, "aviary")).toBe(built);
  });
});

describe("harbor", () => {
  it("loads and, after the trip, collects coins + tokens + gems", () => {
    let s = base({ level: HARBOR_UNLOCK_LEVEL });
    s = { ...s, inventory: { ...s.harbor.manifest.requires } };
    const loaded = loadShip(s, 0);
    expect(loaded.harbor.departedAt).toBe(0);
    expect(collectShip(loaded, SHIP_TRIP_MS - 1)).toBe(loaded);
    const done = collectShip(loaded, SHIP_TRIP_MS);
    expect(done.tokens).toBeGreaterThan(0);
    expect(done.coins).toBeGreaterThan(s.coins);
    expect(done.harbor.departedAt).toBeNull();
  });
});

describe("achievements", () => {
  it("claimable once the stat threshold is reached, then not again", () => {
    const def = allAchievements()[0];
    const s = base({ stats: { [def.stat]: def.threshold } });
    expect(claimableAchievements(s).map((a) => a.id)).toContain(def.id);
    const claimed = claimAchievement(s, def.id);
    expect(claimed.coins).toBe(s.coins + def.rewardCoins);
    expect(claimed.achievements).toContain(def.id);
    expect(claimAchievement(claimed, def.id)).toBe(claimed);
  });

  it("is a no-op below threshold", () => {
    const s = base();
    expect(claimAchievement(s, allAchievements()[0].id)).toBe(s);
  });
});

describe("daily bonus + balloon", () => {
  it("claims once per day and grows the streak on consecutive days", () => {
    const day = 86_400_000;
    const d1 = claimDailyBonus(base(), day * 10 + 5);
    expect(d1.daily.streak).toBe(1);
    expect(claimDailyBonus(d1, day * 10 + 100)).toBe(d1); // same day
    const d2 = claimDailyBonus(d1, day * 11 + 5);
    expect(d2.daily.streak).toBe(2);
    const d3 = claimDailyBonus(d2, day * 20 + 5); // gap → reset
    expect(d3.daily.streak).toBe(1);
  });

  it("pops a balloon for a seeded reward and reschedules", () => {
    const s = base({ balloon: { availableAt: 0, seed: 3 } });
    const next = popBalloon(s, 1_000);
    expect(next).not.toBe(s);
    expect(next.balloon.availableAt).toBe(1_000 + BALLOON_INTERVAL_MS);
    expect(next.balloon.seed).toBe(4);
    expect(popBalloon(next, 2_000)).toBe(next); // not ready yet
  });
});
