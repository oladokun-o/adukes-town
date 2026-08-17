import type { Board } from "./Board";
import { findMatches } from "./matchDetection";
import type { Match, Position } from "./types";

export function trySwap(board: Board, a: Position, b: Position): Match[] | null {
  // Swapping a special piece always triggers it, even with no ordinary line
  // match — standard match-3 behavior, and the only way a player can
  // deliberately fire one rather than waiting for it to get swept into a
  // later match.
  const involvesSpecial = board.get(a).special !== undefined || board.get(b).special !== undefined;

  board.swap(a, b);
  const matches = findMatches(board);

  if (matches.length === 0 && !involvesSpecial) {
    board.swap(a, b);
    return null;
  }

  return matches;
}
