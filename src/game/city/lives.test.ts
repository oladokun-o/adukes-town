import { describe, expect, it } from "vitest";
import { LIFE_REGEN_MS, MAX_LIVES } from "@/game/city/catalog";
import { addLives, currentLives, msToNextLife, spendLife } from "@/game/city/lives";
import { createDefaultCityState, type CityState } from "@/game/city/types";

function withLives(count: number, since: number): CityState {
  return { ...createDefaultCityState(), lives: { count, since } };
}

describe("currentLives", () => {
  it("regenerates one life per LIFE_REGEN_MS from the stored timestamp", () => {
    const s = withLives(2, 0);
    expect(currentLives(s, 0)).toBe(2);
    expect(currentLives(s, LIFE_REGEN_MS - 1)).toBe(2);
    expect(currentLives(s, LIFE_REGEN_MS)).toBe(3);
    expect(currentLives(s, LIFE_REGEN_MS * 5)).toBe(7);
  });

  it("never exceeds MAX_LIVES", () => {
    expect(currentLives(withLives(MAX_LIVES - 1, 0), LIFE_REGEN_MS * 100)).toBe(MAX_LIVES);
    expect(currentLives(withLives(MAX_LIVES, 0), LIFE_REGEN_MS * 100)).toBe(MAX_LIVES);
  });
});

describe("msToNextLife", () => {
  it("is 0 at full, and counts down otherwise", () => {
    expect(msToNextLife(withLives(MAX_LIVES, 0), 0)).toBe(0);
    expect(msToNextLife(withLives(1, 0), 0)).toBe(LIFE_REGEN_MS);
    expect(msToNextLife(withLives(1, 0), LIFE_REGEN_MS * 0.25)).toBe(LIFE_REGEN_MS * 0.75);
  });
});

describe("spendLife", () => {
  it("drops one life", () => {
    const next = spendLife(withLives(5, 0), LIFE_REGEN_MS);
    expect(next.lives).toEqual({ count: 5, since: LIFE_REGEN_MS });
  });

  it("keeps partial regen progress when spending from a mid-cycle state", () => {
    const now = LIFE_REGEN_MS * 3 + 10_000; // 3 lives regenerated + 10s into the 4th
    const next = spendLife(withLives(0, 0), now);
    // 3 regenerated → 2 after the spend, clock keeps the 10s remainder.
    expect(next.lives.count).toBe(2);
    expect(now - next.lives.since).toBe(10_000);
  });

  it("is a no-op at zero lives", () => {
    const s = withLives(0, 0);
    expect(spendLife(s, 0)).toBe(s);
  });
});

describe("addLives", () => {
  it("tops up toward the cap without losing regen progress", () => {
    const s = withLives(2, 0);
    const next = addLives(s, 3, LIFE_REGEN_MS * 0.5);
    expect(next.lives.count).toBe(5);
    expect(LIFE_REGEN_MS * 0.5 - next.lives.since).toBe(LIFE_REGEN_MS * 0.5);
  });

  it("clamps at MAX_LIVES and is a no-op for non-positive amounts", () => {
    expect(addLives(withLives(MAX_LIVES - 1, 0), 10, 0).lives.count).toBe(MAX_LIVES);
    const s = withLives(3, 0);
    expect(addLives(s, 0, 0)).toBe(s);
  });
});
