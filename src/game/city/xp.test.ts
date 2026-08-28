import { describe, expect, it } from "vitest";
import { createDefaultCityState } from "@/game/city/types";
import { applyXpGain, levelForXp, xpForLevel, xpIntoLevel } from "@/game/city/xp";

describe("xpForLevel / levelForXp", () => {
  it("level 1 costs no XP", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelForXp(0)).toBe(1);
  });

  it("is a strictly increasing curve", () => {
    for (let level = 1; level < 30; level++) {
      expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
    }
  });

  it("round-trips: levelForXp(xpForLevel(n)) === n", () => {
    for (let level = 1; level <= 30; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it("one XP short of a threshold stays on the lower level", () => {
    const threshold = xpForLevel(5);
    expect(levelForXp(threshold - 1)).toBe(4);
    expect(levelForXp(threshold)).toBe(5);
  });
});

describe("xpIntoLevel", () => {
  it("reports progress within the current level", () => {
    const base = xpForLevel(3);
    const span = xpForLevel(4) - base;
    const { current, needed } = xpIntoLevel(base + 2);
    expect(current).toBe(2);
    expect(needed).toBe(span);
  });
});

describe("applyXpGain", () => {
  it("returns the same reference for a non-positive amount", () => {
    const state = createDefaultCityState();
    expect(applyXpGain(state, 0)).toBe(state);
    expect(applyXpGain(state, -5)).toBe(state);
  });

  it("adds XP and recomputes the level", () => {
    const state = createDefaultCityState();
    const next = applyXpGain(state, xpForLevel(3));
    expect(next.xp).toBe(xpForLevel(3));
    expect(next.level).toBe(3);
  });

  it("raises barn capacity on level-up but never shrinks it", () => {
    const state = { ...createDefaultCityState(), barnCapacity: 999 };
    const next = applyXpGain(state, xpForLevel(3));
    expect(next.barnCapacity).toBe(999);
  });
});
