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
  runs: [
    [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
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

  it("creates a Rocket at the seed hint instead of clearing it, on a match-4", () => {
    const board = new Board(4, 1, 5, queueRng(["Blue", "Yellow", "Purple"]));
    let id = 0;
    for (let col = 0; col < 4; col++) {
      board.set({ row: 0, col }, { id: id++, type: "Red" });
    }

    const match: Match = {
      positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      runs: [
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      ],
    };

    const steps = resolveCascade(
      board,
      [match],
      [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    );
    const [step] = steps;

    expect(step.created).toEqual([
      {
        position: { row: 0, col: 2 },
        piece: expect.objectContaining({ type: "Red", special: "Rocket", specialAxis: "row" }),
      },
    ]);
    expect(step.cleared).toHaveLength(3);
    expect(step.cleared.some((c) => c.position.col === 2)).toBe(false);
    expect(board.get({ row: 0, col: 2 }).special).toBe("Rocket");
  });

  it("expands a wave's cleared cells when the match sweeps up an existing special", () => {
    const board = new Board(3, 3, 5, queueRng(["Blue", "Purple", "Red"]));
    const layout: PieceType[][] = [
      ["Red", "Blue", "Yellow"],
      ["Purple", "Green", "Yellow"],
      ["Blue", "Yellow", "Red"],
    ];
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: layout[row][col] });
      }
    }
    board.set(
      { row: 1, col: 1 },
      {
        id,
        type: "Green",
        special: "Rocket",
        specialAxis: "row",
      },
    );

    const match: Match = { positions: [{ row: 1, col: 1 }], runs: [[{ row: 1, col: 1 }]] };

    const steps = resolveCascade(board, [match]);
    const [step] = steps;

    expect(step.cleared).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: { row: 1, col: 0 } }),
        expect.objectContaining({ position: { row: 1, col: 1 } }),
        expect.objectContaining({ position: { row: 1, col: 2 } }),
      ]),
    );
    expect(step.cleared).toHaveLength(3);
  });

  it("triggers a special swapped in with no ordinary match, via swapPositions", () => {
    const board = new Board(3, 3, 5, queueRng(["Blue", "Purple", "Red"]));
    const layout: PieceType[][] = [
      ["Red", "Blue", "Yellow"],
      ["Purple", "Green", "Yellow"],
      ["Blue", "Yellow", "Red"],
    ];
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: layout[row][col] });
      }
    }
    // As if trySwap already moved this Rocket into place — no ordinary
    // match formed, so findMatches(board) would return [].
    board.set({ row: 1, col: 1 }, { id, type: "Green", special: "Rocket", specialAxis: "row" });

    const steps = resolveCascade(
      board,
      [],
      [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
    );

    expect(steps).toHaveLength(1);
    const [step] = steps;
    expect(step.cleared).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: { row: 1, col: 0 } }),
        expect.objectContaining({ position: { row: 1, col: 1 } }),
        expect.objectContaining({ position: { row: 1, col: 2 } }),
      ]),
    );
    expect(step.cleared).toHaveLength(3);
  });

  it("produces no steps when swapPositions holds no special and there are no matches", () => {
    const board = new Board(3, 3, 5, queueRng(["Blue"]));
    let id = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        board.set({ row, col }, { id: id++, type: "Blue" });
      }
    }

    const steps = resolveCascade(
      board,
      [],
      [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
    );

    expect(steps).toEqual([]);
  });
});
