import { describe, expect, it } from "vitest";
import { Board } from "@/game/board/Board";
import { findMatches } from "@/game/board/matchDetection";
import { hasValidMove, reshuffleUntilSolvable } from "@/game/board/noDeadEnd";
import { PIECE_TYPES, type PieceType } from "@/game/board/types";

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

describe("hasValidMove", () => {
  it("returns true when an adjacent swap would create a match", () => {
    const board = buildBoard([["Red", "Red", "Blue", "Red"]]);

    expect(hasValidMove(board)).toBe(true);
  });

  it("returns false for a board with no swap that creates a match", () => {
    // type(r, c) = (r + 2c) mod 5 — verified separately to have no free
    // match and no valid adjacent swap on a 4x4 board.
    const width = 4;
    const height = 4;
    const rows: PieceType[][] = [];
    for (let row = 0; row < height; row++) {
      const line: PieceType[] = [];
      for (let col = 0; col < width; col++) {
        line.push(PIECE_TYPES[(row + 2 * col) % 5]);
      }
      rows.push(line);
    }
    const board = buildBoard(rows);

    expect(findMatches(board)).toEqual([]);
    expect(hasValidMove(board)).toBe(false);
  });
});

describe("reshuffleUntilSolvable", () => {
  it("terminates with a board that has no free match and at least one valid move", () => {
    const board = new Board(8, 8, 5);
    board.refill();

    reshuffleUntilSolvable(board);

    expect(findMatches(board)).toEqual([]);
    expect(hasValidMove(board)).toBe(true);
  });
});
