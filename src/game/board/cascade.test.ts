import { describe, expect, it } from "vitest";
import { Board, type RandomPieceTypeFn } from "@/game/board/Board";
import { resolveCascade } from "@/game/board/cascade";
import type { Match, PieceType } from "@/game/board/types";

function queueRng(queue: PieceType[]): RandomPieceTypeFn {
  let i = 0;
  return () => {
    const type = queue[i % queue.length];
    i++;
    return type;
  };
}

function buildInitialBoard(rng: RandomPieceTypeFn): Board {
  const board = new Board(3, 3, 5, rng);
  const layout: PieceType[][] = [
    ["Blue", "Green", "Yellow"],
    ["Green", "Blue", "Purple"],
    ["Red", "Red", "Red"],
  ];
  let id = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      board.set({ row, col }, { id: id++, type: layout[row][col] });
    }
  }
  return board;
}

const bottomRowMatch: Match = {
  positions: [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ],
};

describe("resolveCascade", () => {
  it("clears the match, drops surviving pieces down, and spawns refills — no chain reaction", () => {
    const board = buildInitialBoard(queueRng(["Yellow", "Purple", "Blue"]));

    const steps = resolveCascade(board, [bottomRowMatch]);

    expect(steps).toHaveLength(1);
    const [step] = steps;

    expect([...step.cleared].sort((a, b) => a.position.col - b.position.col)).toEqual([
      { position: { row: 2, col: 0 }, piece: expect.objectContaining({ type: "Red" }) },
      { position: { row: 2, col: 1 }, piece: expect.objectContaining({ type: "Red" }) },
      { position: { row: 2, col: 2 }, piece: expect.objectContaining({ type: "Red" }) },
    ]);

    expect(step.falls).toEqual(
      expect.arrayContaining([
        { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
        { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 0, col: 1 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 2, col: 1 } },
        { from: { row: 0, col: 2 }, to: { row: 1, col: 2 } },
        { from: { row: 1, col: 2 }, to: { row: 2, col: 2 } },
      ]),
    );
    expect(step.falls).toHaveLength(6);

    expect(step.spawned).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 0 }, piece: expect.objectContaining({ type: "Yellow" }) },
        { position: { row: 0, col: 1 }, piece: expect.objectContaining({ type: "Purple" }) },
        { position: { row: 0, col: 2 }, piece: expect.objectContaining({ type: "Blue" }) },
      ]),
    );
    expect(step.spawned).toHaveLength(3);

    expect(board.get({ row: 1, col: 0 }).type).toBe("Blue");
    expect(board.get({ row: 2, col: 0 }).type).toBe("Green");
    expect(board.get({ row: 0, col: 0 }).type).toBe("Yellow");
  });

  it("chains into a second cascade step when a refill creates a new match", () => {
    const board = buildInitialBoard(
      queueRng(["Yellow", "Yellow", "Yellow", "Purple", "Blue", "Green"]),
    );

    const steps = resolveCascade(board, [bottomRowMatch]);

    expect(steps).toHaveLength(2);

    const [first, second] = steps;
    expect(first.spawned.map((s) => s.piece.type)).toEqual(["Yellow", "Yellow", "Yellow"]);

    expect(second.cleared).toHaveLength(3);
    expect(second.falls).toEqual([]);
    expect(second.spawned).toHaveLength(3);
    expect(second.spawned.map((s) => s.piece.type)).toEqual(["Purple", "Blue", "Green"]);
  });
});
