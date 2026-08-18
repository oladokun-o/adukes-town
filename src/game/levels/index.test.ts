import { describe, expect, it } from "vitest";
import { PIECE_TYPES } from "@/game/board/types";
import { getLevelById, getNextLevel, levels } from "@/game/levels";

describe("level goal reachability", () => {
  // Board.ts's default piece spawner picks from PIECE_TYPES[0..colorCount-1]
  // — a *prefix* of the fixed-order list, not a random N-color subset. A
  // level whose goal names a color past that prefix (e.g. colorCount: 4 with
  // a Purple goal, since Purple is index 4) is unwinnable: that color can
  // never spawn on the board.
  it("only sets goals for colors reachable at the level's colorCount", () => {
    for (const level of levels) {
      const reachable = new Set(PIECE_TYPES.slice(0, level.colorCount));
      const goalColors = Object.keys(level.goal.targets);
      for (const color of goalColors) {
        expect(
          reachable.has(color as (typeof PIECE_TYPES)[number]),
          `${level.id} (${level.name}): goal color "${color}" can never spawn at colorCount=${level.colorCount}`,
        ).toBe(true);
      }
    }
  });
});

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
