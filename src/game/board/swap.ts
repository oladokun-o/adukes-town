import type { Board } from "./Board";
import { findMatches } from "./matchDetection";
import type { Match, Position } from "./types";

export function trySwap(board: Board, a: Position, b: Position): Match[] | null {
  board.swap(a, b);
  const matches = findMatches(board);

  if (matches.length === 0) {
    board.swap(a, b);
    return null;
  }

  return matches;
}
