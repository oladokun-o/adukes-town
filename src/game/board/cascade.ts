import type { Board } from "./Board";
import { findMatches } from "./matchDetection";
import type { CascadeStep, FallMovement, Match, Position, SpawnedPiece } from "./types";

function uniquePositions(matches: Match[]): Position[] {
  const seen = new Set<string>();
  const positions: Position[] = [];
  for (const match of matches) {
    for (const pos of match.positions) {
      const key = `${pos.row},${pos.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        positions.push(pos);
      }
    }
  }
  return positions;
}

export function resolveCascade(board: Board, initialMatches: Match[]): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let matches = initialMatches;

  while (matches.length > 0) {
    const cleared = uniquePositions(matches);
    const affectedCols = [...new Set(cleared.map((pos) => pos.col))];

    for (const pos of cleared) {
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

    steps.push({ cleared, falls, spawned });

    matches = findMatches(board);
  }

  return steps;
}
