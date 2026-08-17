export const PIECE_TYPES = ["Red", "Blue", "Green", "Yellow", "Purple"] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

// Placeholder until a later milestone adds "Striped" | "Wrapped" etc. — kept
// as `never` so `special` can only ever be absent for now, but widening this
// union later won't require touching any code that already treats it as optional.
export type SpecialType = never;

export interface Piece {
  id: number;
  type: PieceType;
  special?: SpecialType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
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

export interface CascadeStep {
  cleared: ClearedPiece[];
  falls: FallMovement[];
  spawned: SpawnedPiece[];
}
