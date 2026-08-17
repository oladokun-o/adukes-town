import { describe, expect, it } from "vitest";
import { Board } from "@/game/board/Board";
import { classifyMatch, expandSpecialClears } from "@/game/board/specials";
import type { Match, Position } from "@/game/board/types";

function line(positions: Position[]): Match {
  return { positions, runs: [positions] };
}

describe("classifyMatch", () => {
  it("returns null for a plain 3-match", () => {
    const match = line([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
    expect(classifyMatch(match)).toBeNull();
  });

  it("returns a row Rocket for a horizontal match-4", () => {
    const run = [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ];
    expect(classifyMatch(line(run))).toEqual({ type: "Rocket", axis: "row" });
  });

  it("returns a col Rocket for a vertical match-4", () => {
    const run = [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ];
    expect(classifyMatch(line(run))).toEqual({ type: "Rocket", axis: "col" });
  });

  it("returns RainbowBall for a match-5 in a line", () => {
    const run = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ];
    expect(classifyMatch(line(run))).toEqual({ type: "RainbowBall" });
  });

  it("returns Bomb for a merged L/T shape (two runs)", () => {
    const match: Match = {
      positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ],
      runs: [
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ],
        [
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 2, col: 1 },
        ],
      ],
    };
    expect(classifyMatch(match)).toEqual({ type: "Bomb" });
  });
});

describe("expandSpecialClears", () => {
  it("sweeps in the whole row for a row Rocket", () => {
    const board = new Board(3, 3, 5);
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: "Blue" });
      }
    }
    board.set(
      { row: 1, col: 1 },
      {
        id,
        type: "Blue",
        special: "Rocket",
        specialAxis: "row",
      },
    );

    const result = expandSpecialClears(board, [{ row: 1, col: 1 }]);

    expect(result).toEqual(
      expect.arrayContaining([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ]),
    );
    expect(result).toHaveLength(3);
  });

  it("sweeps in the whole column for a col Rocket", () => {
    const board = new Board(3, 3, 5);
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: "Blue" });
      }
    }
    board.set(
      { row: 1, col: 1 },
      {
        id,
        type: "Blue",
        special: "Rocket",
        specialAxis: "col",
      },
    );

    const result = expandSpecialClears(board, [{ row: 1, col: 1 }]);

    expect(result).toEqual(
      expect.arrayContaining([
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ]),
    );
    expect(result).toHaveLength(3);
  });

  it("sweeps in a 3x3 block for a Bomb, clipped at the board edge", () => {
    const board = new Board(3, 3, 5);
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: "Blue" });
      }
    }
    board.set({ row: 0, col: 0 }, { id, type: "Blue", special: "Bomb" });

    const result = expandSpecialClears(board, [{ row: 0, col: 0 }]);

    expect(result).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ]),
    );
    expect(result).toHaveLength(4);
  });

  it("sweeps in every same-color piece for a RainbowBall", () => {
    const board = new Board(3, 1, 5);
    board.set({ row: 0, col: 0 }, { id: 0, type: "Red" });
    board.set({ row: 0, col: 1 }, { id: 1, type: "Red", special: "RainbowBall" });
    board.set({ row: 0, col: 2 }, { id: 2, type: "Blue" });

    const result = expandSpecialClears(board, [{ row: 0, col: 1 }]);

    expect(result).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it("does not recursively trigger a special swept up by another special's expansion", () => {
    const board = new Board(3, 3, 5);
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: "Blue" });
      }
    }
    board.set(
      { row: 1, col: 0 },
      {
        id: id++,
        type: "Blue",
        special: "Rocket",
        specialAxis: "row",
      },
    );
    // If a Bomb swept into the Rocket's row were also allowed to trigger,
    // its 3x3 blast would reach into row 0 and row 2 as well.
    board.set({ row: 1, col: 2 }, { id, type: "Green", special: "Bomb" });

    const result = expandSpecialClears(board, [{ row: 1, col: 0 }]);

    expect(result).toEqual(
      expect.arrayContaining([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ]),
    );
    expect(result).toHaveLength(3);
  });
});
