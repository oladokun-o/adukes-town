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

function redrawAllTypes(board: Board): void {
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      board.clear({ row, col });
    }
  }
  board.refill();
}

// Rejection-sampling a solvable arrangement is unbounded in principle — for
// a pathological color multiset, no permutation may satisfy "no free match +
// has a valid move," which would loop forever and hang the tab. Bound each
// strategy instead: first try permuting the current multiset (cheap, and
// preserves piece counts, so this is what actually runs almost every time);
// if that doesn't converge, fall back to independent re-draws (not
// constrained to the current multiset, so strictly more likely to land on a
// solvable board); if even that fails, give up rather than hang — an
// occasional dead-end board (BoardScene reshuffles again on the next match
// anyway) beats an unresponsive game.
const RESHUFFLE_MAX_ATTEMPTS = 300;
const REDRAW_MAX_ATTEMPTS = 300;

export function reshuffleUntilSolvable(board: Board): void {
  for (let attempt = 0; attempt < RESHUFFLE_MAX_ATTEMPTS; attempt++) {
    reshuffleTypes(board);
    if (findMatches(board).length === 0 && hasValidMove(board)) return;
  }

  for (let attempt = 0; attempt < REDRAW_MAX_ATTEMPTS; attempt++) {
    redrawAllTypes(board);
    if (findMatches(board).length === 0 && hasValidMove(board)) return;
  }
}
