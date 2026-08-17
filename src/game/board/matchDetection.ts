import type { Board } from "./Board";
import type { Match, PieceType, Position } from "./types";

function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function scanLine(board: Board, line: Position[]): Position[][] {
  const runs: Position[][] = [];
  let run: Position[] = [];
  let runType: PieceType | null = null;

  for (const pos of line) {
    const type = board.get(pos).type;
    if (type === runType) {
      run.push(pos);
    } else {
      if (run.length >= 3) runs.push(run);
      run = [pos];
      runType = type;
    }
  }
  if (run.length >= 3) runs.push(run);

  return runs;
}

// Runs that share a cell (e.g. a row-run crossing a column-run) describe one
// physical match shape, so they're unioned into a single Match here. This is
// what lets a later milestone tell straight lines apart from L/T shapes by
// inspecting the merged positions, without matchDetection knowing about that.
function mergeRuns(runs: Position[][]): Match[] {
  const parent = new Map<string, string>();
  const posByKey = new Map<string, Position>();

  function find(key: string): string {
    let root = key;
    while (parent.get(root) !== root) {
      root = parent.get(root) as string;
    }
    let cur = key;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur) as string;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const run of runs) {
    const keys = run.map((pos) => {
      const key = positionKey(pos);
      posByKey.set(key, pos);
      if (!parent.has(key)) parent.set(key, key);
      return key;
    });
    for (let i = 1; i < keys.length; i++) {
      union(keys[0], keys[i]);
    }
  }

  const groups = new Map<string, Position[]>();
  for (const key of parent.keys()) {
    const root = find(key);
    const group = groups.get(root) ?? [];
    group.push(posByKey.get(key) as Position);
    groups.set(root, group);
  }

  return Array.from(groups.values()).map((positions) => ({ positions }));
}

export function findMatches(board: Board): Match[] {
  const runs: Position[][] = [];

  for (let row = 0; row < board.height; row++) {
    const line: Position[] = [];
    for (let col = 0; col < board.width; col++) line.push({ row, col });
    runs.push(...scanLine(board, line));
  }

  for (let col = 0; col < board.width; col++) {
    const line: Position[] = [];
    for (let row = 0; row < board.height; row++) line.push({ row, col });
    runs.push(...scanLine(board, line));
  }

  return mergeRuns(runs);
}
