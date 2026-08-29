import { describe, expect, it } from "vitest";
import { createDefaultCityState, type CityState } from "@/game/city/types";
import { townReputation } from "@/game/city/town";
import {
  celebrateFestival,
  celebratableFestivals,
  CHARACTER_IDS,
  createDefaultStoryState,
  festivalActiveOn,
  getAllFacts,
  getFestival,
  getLineForVisit,
  getProfile,
  MAX_HEARTS,
  narrativeReputation,
  pendingRemembers,
  rememberableFacts,
  rememberFact,
  repairSetback,
  talkTo,
  totalHearts,
  generateSetback,
} from "@/game/story";

function base(extra: Partial<CityState> = {}): CityState {
  return { ...createDefaultCityState(), level: 12, coins: 10_000, ...extra };
}

describe("story defaults & catalog", () => {
  it("every character has a profile, a script, and at least one fact", () => {
    for (const id of CHARACTER_IDS) {
      const p = getProfile(id);
      expect(p.id).toBe(id);
      expect(p.script.length).toBeGreaterThan(0);
      expect(getAllFacts(id).length).toBeGreaterThan(0);
    }
  });

  it("getLineForVisit clamps to the last unlocked line", () => {
    const p = getProfile("dapo");
    const last = p.script[p.script.length - 1];
    expect(getLineForVisit("dapo", 999)).toEqual(last);
    expect(getLineForVisit("dapo", 0)).toBeNull();
  });

  it("festival gift ids resolve and dates are valid", () => {
    for (const f of CHARACTER_IDS.map((id) => `${id}-birthday`)) {
      const def = getFestival(f)!;
      expect(def.month).toBeGreaterThanOrEqual(1);
      expect(def.month).toBeLessThanOrEqual(12);
      expect(Object.keys(def.gift).length).toBeGreaterThan(0);
    }
  });
});

describe("talkTo + rememberFact", () => {
  it("discovers the visit-1 fact, then Remember pays coins + XP + a heart, once", () => {
    let s = base();
    s = talkTo(s, "dapo");
    expect(s.story.characters.dapo.visits).toBe(1);
    const fact = rememberableFacts(s, "dapo")[0];
    expect(fact).toBeDefined();

    const before = s.coins;
    s = rememberFact(s, "dapo", fact.id);
    expect(s.coins).toBe(before + 30);
    expect(s.xp).toBeGreaterThan(0);
    expect(s.story.characters.dapo.hearts).toBe(1);

    // Not repeatable.
    expect(rememberFact(s, "dapo", fact.id)).toBe(s);
  });

  it("rememberFact is a no-op for an undiscovered fact", () => {
    const s = base();
    expect(rememberFact(s, "dapo", "garlic-sauce")).toBe(s);
  });

  it("pendingRemembers counts across the cast", () => {
    let s = base();
    s = talkTo(s, "dapo");
    s = talkTo(s, "simi");
    expect(pendingRemembers(s)).toBe(2);
  });
});

describe("festivals", () => {
  it("celebrate consumes the gift, pays coins + hearts, and can't repeat", () => {
    const def = getFestival("dapo-birthday")!;
    const now = new Date(2026, def.month - 1, def.day).getTime();
    expect(festivalActiveOn(def, now)).toBe(true);

    let s = base({ inventory: { ...def.gift } });
    expect(celebratableFestivals(s, now).some((f) => f.festival.id === def.id)).toBe(true);

    const before = s.coins;
    s = celebrateFestival(s, def.id, now);
    expect(s.coins).toBe(before + def.rewardCoins);
    expect(s.story.characters.dapo.hearts).toBe(def.rewardHearts);
    expect(Object.keys(s.inventory)).not.toContain(Object.keys(def.gift)[0]);

    expect(celebrateFestival(s, def.id, now)).toBe(s);
  });

  it("celebrate is a no-op out of season or without the gift", () => {
    const def = getFestival("simi-birthday")!;
    const offSeason = new Date(2026, (def.month + 5) % 12, 1).getTime();
    expect(celebrateFestival(base({ inventory: { ...def.gift } }), def.id, offSeason)).toEqual(
      base({ inventory: { ...def.gift } }),
    );
    const inSeason = new Date(2026, def.month - 1, def.day).getTime();
    const noGift = base();
    expect(celebrateFestival(noGift, def.id, inSeason)).toBe(noGift);
  });
});

describe("setbacks + reputation", () => {
  it("repairSetback clears an active setback when affordable, granting XP", () => {
    const setback = generateSetback(3);
    const s = base({
      materials: { mat_plank: 50, mat_nail: 50, mat_bolt: 50, mat_brick: 50 },
      story: { ...createDefaultStoryState(), activeSetback: setback },
    });
    const next = repairSetback(s);
    expect(next.story.activeSetback).toBeNull();
    expect(next.coins).toBe(s.coins - setback.repairCoins);
    expect(next.xp).toBeGreaterThan(0);
  });

  it("repairSetback is a no-op with nothing to repair or no resources", () => {
    const noSetback = base();
    expect(repairSetback(noSetback)).toBe(noSetback);
    const broke = base({
      coins: 0,
      story: { ...createDefaultStoryState(), activeSetback: generateSetback(1) },
    });
    expect(repairSetback(broke)).toBe(broke);
  });

  it("narrative reputation tracks hearts and folds into townReputation", () => {
    let s = base();
    expect(narrativeReputation(s.story)).toBe(0);
    s = rememberFact(talkTo(s, "dapo"), "dapo", getAllFacts("dapo")[0].id);
    expect(totalHearts(s)).toBe(1);
    expect(narrativeReputation(s.story)).toBeGreaterThan(0);
    expect(townReputation(s)).toBeGreaterThanOrEqual(narrativeReputation(s.story));
  });

  it("an active setback never pushes town reputation below zero", () => {
    const s = base({
      story: { ...createDefaultStoryState(), activeSetback: generateSetback(2) },
    });
    expect(townReputation(s)).toBe(0);
  });
});

describe("MAX_HEARTS cap", () => {
  it("hearts never exceed the cap", () => {
    let s = base({ inventory: {} });
    // Force a lot of celebrations by hand via repeated remember + festival.
    for (const id of CHARACTER_IDS) {
      for (let v = 0; v < 6; v++) s = talkTo(s, id);
      for (const fact of getAllFacts(id)) s = rememberFact(s, id, fact.id);
      expect(s.story.characters[id].hearts).toBeLessThanOrEqual(MAX_HEARTS);
    }
  });
});
