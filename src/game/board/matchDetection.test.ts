import { describe, expect, it } from "vitest";
import { Board } from "@/game/board/Board";
import { findMatches } from "@/game/board/matchDetection";
import type { PieceType, Position } from "@/game/board/types";

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

function sortPositions(positions: Position[]): Position[] {
  return [...positions].sort((a, b) => a.row - b.row || a.col - b.col);
}

describe("findMatches", () => {
  it("finds a straight horizontal 3-run", () => {
    const board = buildBoard([
      ["Red", "Red", "Red"],
      ["Blue", "Green", "Yellow"],
      ["Purple", "Blue", "Green"],
    ]);

    const matches = findMatches(board);

    expect(matches).toHaveLength(1);
    expect(sortPositions(matches[0].positions)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it("finds a straight horizontal 4-run", () => {
    const board = buildBoard([["Red", "Red", "Red", "Red"]]);

    const matches = findMatches(board);

    expect(matches).toHaveLength(1);
    expect(matches[0].positions).toHaveLength(4);
  });

  it("finds a straight vertical 5-run", () => {
    const board = buildBoard([["Blue"], ["Blue"], ["Blue"], ["Blue"], ["Blue"]]);

    const matches = findMatches(board);

    expect(matches).toHaveLength(1);
    expect(matches[0].positions).toHaveLength(5);
  });

  it("reports a single unmerged run's positions in `runs`", () => {
    const board = buildBoard([["Red", "Red", "Red", "Red"]]);

    const matches = findMatches(board);

    expect(matches[0].runs).toHaveLength(1);
    expect(sortPositions(matches[0].runs[0])).toEqual(sortPositions(matches[0].positions));
  });

  it("merges a row-run and a column-run that share a cell into one match", () => {
    const board = buildBoard([
      ["Red", "Red", "Red"],
      ["Blue", "Red", "Green"],
      ["Yellow", "Red", "Purple"],
    ]);

    const matches = findMatches(board);

    expect(matches).toHaveLength(1);
    expect(sortPositions(matches[0].positions)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ]);
    expect(matches[0].runs).toHaveLength(2);
  });

  it("returns no matches when no run reaches length 3", () => {
    const board = buildBoard([
      ["Red", "Blue", "Green"],
      ["Blue", "Green", "Red"],
      ["Green", "Red", "Blue"],
    ]);

    expect(findMatches(board)).toEqual([]);
  });
});
