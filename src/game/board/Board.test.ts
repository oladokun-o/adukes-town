import { describe, expect, it } from "vitest";
import { Board } from "@/game/board/Board";
import type { Piece } from "@/game/board/types";

function piece(id: number, type: Piece["type"]): Piece {
  return { id, type };
}

describe("Board", () => {
  it("stores and retrieves pieces by position via get/set", () => {
    const board = new Board(3, 3, 5);
    const p = piece(1, "Red");
    board.set({ row: 1, col: 2 }, p);
    expect(board.get({ row: 1, col: 2 })).toBe(p);
  });

  it("get throws for an empty cell", () => {
    const board = new Board(2, 2, 5);
    expect(() => board.get({ row: 0, col: 0 })).toThrow();
  });

  it("peek returns null for an empty cell without throwing", () => {
    const board = new Board(2, 2, 5);
    expect(board.peek({ row: 0, col: 0 })).toBeNull();
  });

  it("swap exchanges two pieces in place", () => {
    const board = new Board(2, 1, 5);
    const a = piece(1, "Red");
    const b = piece(2, "Blue");
    board.set({ row: 0, col: 0 }, a);
    board.set({ row: 0, col: 1 }, b);

    board.swap({ row: 0, col: 0 }, { row: 0, col: 1 });

    expect(board.get({ row: 0, col: 0 })).toBe(b);
    expect(board.get({ row: 0, col: 1 })).toBe(a);
  });

  it("collapseColumn drops surviving pieces to the bottom and leaves empties at the top", () => {
    const board = new Board(1, 4, 5);
    const mid = piece(1, "Blue");
    const bottom = piece(2, "Red");
    board.set({ row: 1, col: 0 }, mid);
    board.set({ row: 3, col: 0 }, bottom);

    board.collapseColumn(0);

    expect(board.peek({ row: 0, col: 0 })).toBeNull();
    expect(board.peek({ row: 1, col: 0 })).toBeNull();
    expect(board.get({ row: 2, col: 0 })).toBe(mid);
    expect(board.get({ row: 3, col: 0 })).toBe(bottom);
  });

  it("refill fills empty cells using the injected RNG", () => {
    const board = new Board(2, 2, 5, () => "Purple");

    board.refill();

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        expect(board.get({ row, col }).type).toBe("Purple");
      }
    }
  });

  it("refill leaves already-occupied cells untouched", () => {
    const board = new Board(1, 2, 5, () => "Purple");
    const existing = piece(9, "Red");
    board.set({ row: 0, col: 0 }, existing);

    board.refill();

    expect(board.get({ row: 0, col: 0 })).toBe(existing);
    expect(board.get({ row: 1, col: 0 }).type).toBe("Purple");
  });

  it("clone produces an independent deep copy", () => {
    const board = new Board(1, 1, 5);
    const p = piece(1, "Red");
    board.set({ row: 0, col: 0 }, p);

    const copy = board.clone();
    copy.get({ row: 0, col: 0 }).type = "Blue";

    expect(board.get({ row: 0, col: 0 }).type).toBe("Red");
    expect(board.get({ row: 0, col: 0 })).not.toBe(copy.get({ row: 0, col: 0 }));
  });
});
