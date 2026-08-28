import { describe, expect, it } from "vitest";
import { RECIPES } from "@/game/city/catalog";
import {
  activeRemainingMs,
  emptyFactory,
  pendingCount,
  readyCount,
  settleFactory,
} from "@/game/city/factory";

const FLOUR = RECIPES.flour.produceMs;

describe("settleFactory", () => {
  it("reports nothing done for an empty factory", () => {
    const s = settleFactory(emptyFactory(), 1000);
    expect(s).toEqual({ done: [], remaining: [], remainingStartedAt: null });
  });

  it("splits the queue at the elapsed cook boundary", () => {
    const f = { queue: ["flour", "flour", "flour"], startedAt: 0 };
    const s = settleFactory(f, FLOUR + 1);
    expect(s.done).toEqual(["flour"]);
    expect(s.remaining).toEqual(["flour", "flour"]);
    expect(s.remainingStartedAt).toBe(FLOUR);
  });

  it("marks everything done once enough time has passed", () => {
    const f = { queue: ["flour", "flour"], startedAt: 0 };
    const s = settleFactory(f, FLOUR * 5);
    expect(s.done).toEqual(["flour", "flour"]);
    expect(s.remaining).toEqual([]);
    expect(s.remainingStartedAt).toBeNull();
  });
});

describe("readyCount / pendingCount / activeRemainingMs", () => {
  it("counts done vs still-cooking and the active countdown", () => {
    const f = { queue: ["flour", "flour"], startedAt: 0 };
    expect(readyCount(f, FLOUR + 1)).toBe(1);
    expect(pendingCount(f, FLOUR + 1)).toBe(1);
    // second slot started at FLOUR, so at FLOUR+1 it has FLOUR-1 left
    expect(activeRemainingMs(f, FLOUR + 1)).toBe(FLOUR - 1);
  });

  it("active countdown is 0 when the queue is empty", () => {
    expect(activeRemainingMs(emptyFactory(), 1000)).toBe(0);
  });
});
