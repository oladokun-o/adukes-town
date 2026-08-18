import { describe, expect, it } from "vitest";
import { getLevelById, getNextLevel, levels } from "@/game/levels";

describe("getNextLevel", () => {
  it("returns the following level in order", () => {
    const first = levels[0];
    const second = levels[1];
    expect(getNextLevel(first.id)).toEqual(second);
  });

  it("returns null for the last level", () => {
    const last = levels[levels.length - 1];
    expect(getNextLevel(last.id)).toBeNull();
  });

  it("returns null for an unknown level id", () => {
    expect(getNextLevel("does-not-exist")).toBeNull();
  });
});

describe("getLevelById", () => {
  it("throws for an unknown level id", () => {
    expect(() => getLevelById("does-not-exist")).toThrow();
  });
});
