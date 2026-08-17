import type { Board } from "./Board";
import { findMatches } from "./matchDetection";
import { classifyMatch, expandSpecialClears, type SpecialCreation } from "./specials";
import type {
  CascadeStep,
  ClearedPiece,
  CreatedPiece,
  FallMovement,
  Match,
  Position,
  SpawnedPiece,
} from "./types";

function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function uniquePositions(matches: Match[]): Position[] {
  const seen = new Set<string>();
  const positions: Position[] = [];
  for (const match of matches) {
    for (const pos of match.positions) {
      const key = positionKey(pos);
      if (!seen.has(key)) {
        seen.add(key);
        positions.push(pos);
      }
    }
  }
  return positions;
}

// The cell that keeps a piece (converted to the special) instead of being
// cleared. Prefers the swap-target hint when it's part of this match (the
// player's own swap should be the one that "becomes" the special); a Bomb's
// L/T shape otherwise seeds at the run intersection, everything else at the
// midpoint of its single contributing run.
function pickSeedPosition(match: Match, seedHint: Position | undefined): Position {
  if (seedHint && match.positions.some((pos) => positionKey(pos) === positionKey(seedHint))) {
    return seedHint;
  }

  if (match.runs.length > 1) {
    const runKeySets = match.runs.map((run) => new Set(run.map(positionKey)));
    const intersection = match.positions.find(
      (pos) => runKeySets.filter((keys) => keys.has(positionKey(pos))).length > 1,
    );
    if (intersection) return intersection;
  }

  const run = match.runs[0] ?? match.positions;
  return run[Math.floor(run.length / 2)];
}

export function resolveCascade(
  board: Board,
  initialMatches: Match[],
  swapPositions?: [Position, Position],
): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let matches = initialMatches;

  // Swapping a special piece always triggers it (see swap.ts), even when
  // that swap forms no ordinary line match. Fold any such position not
  // already covered by a real match into a positions-only pseudo-match, so
  // it flows through the same clearing/expansion pipeline below —
  // classifyMatch never creates a new special from it (no runs), it just
  // makes expandSpecialClears see it and fire the special's effect.
  if (swapPositions) {
    const alreadyMatched = new Set(uniquePositions(matches).map(positionKey));
    const triggered = swapPositions.filter(
      (pos) => board.peek(pos)?.special !== undefined && !alreadyMatched.has(positionKey(pos)),
    );
    if (triggered.length > 0) {
      matches = [...matches, { positions: triggered, runs: [] }];
    }
  }

  let hint = swapPositions?.[1];
  let swapPair = swapPositions;

  while (matches.length > 0) {
    const creations = new Map<string, { seed: Position; creation: SpecialCreation }>();
    for (const match of matches) {
      const creation = classifyMatch(match);
      if (!creation) continue;
      const seed = pickSeedPosition(match, hint);
      creations.set(positionKey(seed), { seed, creation });
    }

    const clearedPositionsRaw = uniquePositions(matches).filter(
      (pos) => !creations.has(positionKey(pos)),
    );
    const clearedPositions = expandSpecialClears(board, clearedPositionsRaw, swapPair);
    const affectedCols = [...new Set(clearedPositions.map((pos) => pos.col))];

    const cleared: ClearedPiece[] = clearedPositions.map((position) => ({
      position,
      piece: board.get(position),
    }));

    const created: CreatedPiece[] = [];
    for (const { seed, creation } of creations.values()) {
      const piece = board.get(seed);
      piece.special = creation.type;
      if (creation.axis) piece.specialAxis = creation.axis;
      created.push({ position: seed, piece });
    }

    for (const pos of clearedPositions) {
      board.clear(pos);
    }

    const falls: FallMovement[] = [];
    const spawnStart = new Map<number, number>();

    for (const col of affectedCols) {
      const survivorRows: number[] = [];
      for (let row = 0; row < board.height; row++) {
        if (board.peek({ row, col }) !== null) survivorRows.push(row);
      }

      board.collapseColumn(col);

      const firstSurvivorRow = board.height - survivorRows.length;
      survivorRows.forEach((fromRow, i) => {
        const toRow = firstSurvivorRow + i;
        if (fromRow !== toRow) {
          falls.push({ from: { row: fromRow, col }, to: { row: toRow, col } });
        }
      });

      spawnStart.set(col, firstSurvivorRow);
    }

    board.refill();

    const spawned: SpawnedPiece[] = [];
    for (const [col, firstSurvivorRow] of spawnStart) {
      for (let row = 0; row < firstSurvivorRow; row++) {
        const position = { row, col };
        spawned.push({ position, piece: board.get(position) });
      }
    }

    steps.push({ cleared, falls, spawned, created });

    matches = findMatches(board);
    hint = undefined;
    swapPair = undefined;
  }

  return steps;
}
