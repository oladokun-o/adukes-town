import { describe, expect, it } from "vitest";
import { cropStage, isReady, remainingMs, startTimer } from "@/game/city/timers";

describe("startTimer", () => {
  it("sets readyAt to now + duration", () => {
    expect(startTimer(1000, 500)).toEqual({ startedAt: 1000, readyAt: 1500 });
  });
});

describe("isReady", () => {
  it("is false for a null timer", () => {
    expect(isReady(null, 1000)).toBe(false);
  });

  it("is false before readyAt", () => {
    const timer = startTimer(0, 1000);
    expect(isReady(timer, 999)).toBe(false);
  });

  it("is true exactly at readyAt", () => {
    const timer = startTimer(0, 1000);
    expect(isReady(timer, 1000)).toBe(true);
  });

  it("is true after readyAt", () => {
    const timer = startTimer(0, 1000);
    expect(isReady(timer, 5000)).toBe(true);
  });
});

describe("remainingMs", () => {
  it("is 0 for a null timer", () => {
    expect(remainingMs(null, 1000)).toBe(0);
  });

  it("counts down toward readyAt", () => {
    const timer = startTimer(0, 1000);
    expect(remainingMs(timer, 400)).toBe(600);
  });

  it("never goes negative once past readyAt", () => {
    const timer = startTimer(0, 1000);
    expect(remainingMs(timer, 5000)).toBe(0);
  });
});

describe("cropStage", () => {
  it("is null for an empty plot", () => {
    expect(cropStage(null, 1000)).toBeNull();
  });

  it("is sprout for the first half of growth", () => {
    const timer = startTimer(0, 1000);
    expect(cropStage(timer, 0)).toBe("sprout");
    expect(cropStage(timer, 499)).toBe("sprout");
  });

  it("is growing for the second half of growth", () => {
    const timer = startTimer(0, 1000);
    expect(cropStage(timer, 500)).toBe("growing");
    expect(cropStage(timer, 999)).toBe("growing");
  });

  it("is full once ready", () => {
    const timer = startTimer(0, 1000);
    expect(cropStage(timer, 1000)).toBe("full");
    expect(cropStage(timer, 5000)).toBe("full");
  });
});
