import { describe, expect, it } from "vitest";
import { Board } from "@/game/board/Board";
import { trySwap } from "@/game/board/swap";
import type { PieceType } from "@/game/board/types";

function buildBoard(rows: PieceType[][]): Board {
  const height = rows.length;
  const width = rows[0].length;
  const board = new Board(width, height, 5);
  let id = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      board.set({ row, col }, { id: id++, type: rows[row][col] });
    }
  }
  return board;
}

describe("trySwap", () => {
  it("reverts the swap and returns null when it produces no match", () => {
    const board = buildBoard([
      ["Red", "Blue", "Green"],
      ["Blue", "Green", "Red"],
      ["Green", "Red", "Blue"],
    ]);

    const before = {
      a: board.get({ row: 0, col: 0 }).type,
      b: board.get({ row: 0, col: 1 }).type,
    };

    const result = trySwap(board, { row: 0, col: 0 }, { row: 0, col: 1 });

    expect(result).toBeNull();
    expect(board.get({ row: 0, col: 0 }).type).toBe(before.a);
    expect(board.get({ row: 0, col: 1 }).type).toBe(before.b);
  });

  it("commits the swap and returns the matches when it produces one", () => {
    const board = buildBoard([
      ["Red", "Red", "Blue"],
      ["Blue", "Green", "Red"],
      ["Green", "Red", "Blue"],
    ]);

    const result = trySwap(board, { row: 0, col: 2 }, { row: 1, col: 2 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0].positions).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ]),
    );

    expect(board.get({ row: 0, col: 2 }).type).toBe("Red");
    expect(board.get({ row: 1, col: 2 }).type).toBe("Blue");
  });
});
