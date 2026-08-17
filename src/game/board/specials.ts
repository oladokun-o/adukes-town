import type { Board } from "./Board";
import type { Match, Piece, Position, SpecialType } from "./types";

function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export interface SpecialCreation {
  type: SpecialType;
  // Rocket only.
  axis?: "row" | "col";
}

// What special (if any) a matched shape creates. A merged L/T shape (two
// runs sharing a cell) only ever reaches matchDetection's mergeRuns when
// each run is >= 3 long, so it's always >= 5 cells — no separate length
// check needed here.
export function classifyMatch(match: Match): SpecialCreation | null {
  if (match.runs.length > 1) {
    return { type: "Bomb" };
  }

  const [run] = match.runs;
  if (!run || run.length < 4) return null;

  if (run.length >= 5) {
    return { type: "RainbowBall" };
  }

  const axis = run[0].row === run[1].row ? "row" : "col";
  return { type: "Rocket", axis };
}

function rocketClearPositions(board: Board, seed: Position, axis: "row" | "col"): Position[] {
  const positions: Position[] = [];
  if (axis === "row") {
    for (let col = 0; col < board.width; col++) positions.push({ row: seed.row, col });
  } else {
    for (let row = 0; row < board.height; row++) positions.push({ row, col: seed.col });
  }
  return positions;
}

const BOMB_RADIUS = 1;

function bombClearPositions(board: Board, seed: Position): Position[] {
  const positions: Position[] = [];
  for (let row = seed.row - BOMB_RADIUS; row <= seed.row + BOMB_RADIUS; row++) {
    for (let col = seed.col - BOMB_RADIUS; col <= seed.col + BOMB_RADIUS; col++) {
      if (row < 0 || row >= board.height || col < 0 || col >= board.width) continue;
      positions.push({ row, col });
    }
  }
  return positions;
}

function rainbowClearPositions(board: Board, piece: Piece): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const pos = { row, col };
      const other = board.peek(pos);
      if (other !== null && other.type === piece.type) positions.push(pos);
    }
  }
  return positions;
}

// Expands a set of about-to-be-cleared positions to include the extra cells
// any special piece among them sweeps in. Single-level only: a special swept
// up by another special's expansion clears as a plain piece — it does not
// also trigger.
export function expandSpecialClears(board: Board, positions: Position[]): Position[] {
  const seen = new Set(positions.map(positionKey));
  const result = [...positions];

  for (const pos of positions) {
    const piece = board.peek(pos);
    if (!piece?.special) continue;

    const extra =
      piece.special === "Rocket"
        ? rocketClearPositions(board, pos, piece.specialAxis ?? "row")
        : piece.special === "Bomb"
          ? bombClearPositions(board, pos)
          : rainbowClearPositions(board, piece);

    for (const extraPos of extra) {
      const key = positionKey(extraPos);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(extraPos);
    }
  }

  return result;
}
