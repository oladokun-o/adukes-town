import { PIECE_TYPES, type Piece, type PieceType, type Position } from "./types";

export type RandomPieceTypeFn = (colorCount: number) => PieceType;

function defaultRandomPieceType(colorCount: number): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * colorCount)];
}

export class Board {
  readonly width: number;
  readonly height: number;
  readonly colorCount: number;

  private cells: Array<Piece | null>;
  private randomPieceType: RandomPieceTypeFn;
  private nextId: number;

  constructor(
    width: number,
    height: number,
    colorCount: number,
    randomPieceType: RandomPieceTypeFn = defaultRandomPieceType,
  ) {
    this.width = width;
    this.height = height;
    this.colorCount = colorCount;
    this.randomPieceType = randomPieceType;
    this.nextId = 0;
    this.cells = new Array(width * height).fill(null);
  }

  private index(pos: Position): number {
    return pos.row * this.width + pos.col;
  }

  private createPiece(): Piece {
    return { id: this.nextId++, type: this.randomPieceType(this.colorCount) };
  }

  get(pos: Position): Piece {
    const piece = this.cells[this.index(pos)];
    if (piece === null) {
      throw new Error(`Board.get: no piece at (${pos.row}, ${pos.col})`);
    }
    return piece;
  }

  set(pos: Position, piece: Piece): void {
    this.cells[this.index(pos)] = piece;
  }

  // Null-tolerant read for internal/collaborator use (cascade resolution
  // inspects cells mid-clear, before refill() has guaranteed a full board).
  peek(pos: Position): Piece | null {
    return this.cells[this.index(pos)];
  }

  clear(pos: Position): void {
    this.cells[this.index(pos)] = null;
  }

  swap(a: Position, b: Position): void {
    const ia = this.index(a);
    const ib = this.index(b);
    const temp = this.cells[ia];
    this.cells[ia] = this.cells[ib];
    this.cells[ib] = temp;
  }

  collapseColumn(col: number): void {
    const survivors: Piece[] = [];
    for (let row = 0; row < this.height; row++) {
      const piece = this.cells[this.index({ row, col })];
      if (piece !== null) {
        survivors.push(piece);
      }
    }

    const emptyCount = this.height - survivors.length;
    for (let row = 0; row < this.height; row++) {
      const piece = row < emptyCount ? null : survivors[row - emptyCount];
      this.cells[this.index({ row, col })] = piece;
    }
  }

  refill(): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const pos = { row, col };
        if (this.cells[this.index(pos)] === null) {
          this.cells[this.index(pos)] = this.createPiece();
        }
      }
    }
  }

  clone(): Board {
    const copy = new Board(this.width, this.height, this.colorCount, this.randomPieceType);
    copy.cells = this.cells.map((piece) => (piece === null ? null : { ...piece }));
    copy.nextId = this.nextId;
    return copy;
  }
}
