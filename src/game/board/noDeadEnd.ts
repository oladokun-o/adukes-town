import type { Board } from "./Board";
import { findMatches } from "./matchDetection";
import type { PieceType, Position } from "./types";

function wouldMatch(board: Board, a: Position, b: Position): boolean {
  const scratch = board.clone();
  scratch.swap(a, b);
  return findMatches(scratch).length > 0;
}

export function hasValidMove(board: Board): boolean {
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const pos = { row, col };
      if (col + 1 < board.width && wouldMatch(board, pos, { row, col: col + 1 })) {
        return true;
      }
      if (row + 1 < board.height && wouldMatch(board, pos, { row: row + 1, col })) {
        return true;
      }
    }
  }
  return false;
}

function reshuffleTypes(board: Board): void {
  const positions: Position[] = [];
  const types: PieceType[] = [];

  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const pos = { row, col };
      positions.push(pos);
      types.push(board.get(pos).type);
    }
  }

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  positions.forEach((pos, i) => {
    board.get(pos).type = types[i];
  });
}

export function reshuffleUntilSolvable(board: Board): void {
  do {
    reshuffleTypes(board);
  } while (findMatches(board).length > 0 || !hasValidMove(board));
}
