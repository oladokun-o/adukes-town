export const PIECE_TYPES = ["Red", "Blue", "Green", "Yellow", "Purple"] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

export type SpecialType = "Rocket" | "Bomb" | "RainbowBall";

export interface Piece {
  id: number;
  type: PieceType;
  special?: SpecialType;
  // Rocket only — which line it clears when triggered.
  specialAxis?: "row" | "col";
}

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  // The original scanned runs (pre-merge) that make up this match — lets
  // callers tell a straight line apart from an L/T shape without re-deriving
  // it from `positions`.
  runs: Position[][];
}

export interface FallMovement {
  from: Position;
  to: Position;
}

export interface SpawnedPiece {
  position: Position;
  piece: Piece;
}

export interface ClearedPiece {
  position: Position;
  piece: Piece;
}

export interface CreatedPiece {
  position: Position;
  piece: Piece;
}

export interface CascadeStep {
  cleared: ClearedPiece[];
  falls: FallMovement[];
  spawned: SpawnedPiece[];
  // Cells where an existing piece was converted into a special in place,
  // rather than cleared — distinct from `cleared`/`spawned`.
  created: CreatedPiece[];
}
