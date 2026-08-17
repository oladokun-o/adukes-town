import type { PieceType } from "@/game/board/types";

export interface LevelDef {
  id: string;
  name: string;
  width: number;
  height: number;
  colorCount: number;
  moveLimit: number;
  goal: { targets: Partial<Record<PieceType, number>> };
}
