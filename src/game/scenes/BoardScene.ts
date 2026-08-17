import Phaser from "phaser";
import { Board } from "@/game/board/Board";
import { resolveCascade } from "@/game/board/cascade";
import { hasValidMove, reshuffleUntilSolvable } from "@/game/board/noDeadEnd";
import { trySwap } from "@/game/board/swap";
import type { CascadeStep, Piece, PieceType, Position, SpawnedPiece } from "@/game/board/types";
import { emitGameEvent, GameEvents, offGameEvent, onGameEvent } from "@/game/events";
import { getLevelById } from "@/game/levels";
import type { LevelDef } from "@/game/levels/types";
import { ensurePieceTextures, pieceTextureKey } from "@/game/scenes/pieceTextures";

const PIECE_TEXTURE_SIZE = 128;
const BOARD_MARGIN = 0.9;
const PIECE_SCALE = 0.86;
const SWAP_DURATION_MS = 150;
const CLEAR_DURATION_MS = 150;
const FALL_DURATION_MS = 200;
const RESHUFFLE_FADE_MS = 200;
const DRAG_THRESHOLD_RATIO = 0.2;

function key(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

interface DragState {
  start: Position;
  startX: number;
  startY: number;
  resolved: boolean;
}

export class BoardScene extends Phaser.Scene {
  private level!: LevelDef;
  private board!: Board;
  private cellSize = 0;
  private originX = 0;
  private originY = 0;
  private spriteById = new Map<number, Phaser.GameObjects.Sprite>();
  private pieceIdAt = new Map<string, number>();
  private drag: DragState | null = null;
  private busy = false;
  private movesRemaining = 0;
  private goalProgress: Partial<Record<PieceType, number>> = {};
  private levelOver = false;
  private paused = false;

  constructor() {
    super("BoardScene");
  }

  init(data: { level?: LevelDef }): void {
    this.level = data.level ?? getLevelById("level001");
    this.movesRemaining = this.level.moveLimit;
    this.goalProgress = {};
    this.levelOver = false;
    this.paused = false;
  }

  create(): void {
    ensurePieceTextures(this, PIECE_TEXTURE_SIZE);

    this.board = new Board(this.level.width, this.level.height, this.level.colorCount);
    this.board.refill();
    reshuffleUntilSolvable(this.board);

    this.computeLayout();
    this.renderFullBoard(false);

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
    this.input.on("pointerupoutside", this.onPointerUp, this);

    onGameEvent(GameEvents.PauseToggle, this.onPauseToggle, this);
    // BoardScene is never restarted with a stale listener today (no other
    // scene re-creates it), but this keeps the shared emitter clean if that
    // changes later.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offGameEvent(GameEvents.PauseToggle, this.onPauseToggle, this);
    });

    this.emitMovesChanged();
    this.emitGoalProgress();
  }

  private onPauseToggle(): void {
    this.paused = !this.paused;
  }

  private emitMovesChanged(): void {
    emitGameEvent(GameEvents.MovesChanged, {
      movesRemaining: this.movesRemaining,
      moveLimit: this.level.moveLimit,
    });
  }

  private emitGoalProgress(): void {
    emitGameEvent(GameEvents.GoalProgress, {
      targets: this.level.goal.targets,
      progress: this.goalProgress,
    });
  }

  private computeLayout(): void {
    const availW = this.cameras.main.width;
    const availH = this.cameras.main.height;
    this.cellSize = Math.floor(
      (Math.min(availW, availH) * BOARD_MARGIN) / Math.max(this.level.width, this.level.height),
    );
    const boardPixelWidth = this.cellSize * this.level.width;
    const boardPixelHeight = this.cellSize * this.level.height;
    this.originX = (availW - boardPixelWidth) / 2;
    this.originY = (availH - boardPixelHeight) / 2;
  }

  private screenX(col: number): number {
    return this.originX + col * this.cellSize + this.cellSize / 2;
  }

  private screenY(row: number): number {
    return this.originY + row * this.cellSize + this.cellSize / 2;
  }

  private createSprite(piece: Piece, x: number, y: number): Phaser.GameObjects.Sprite {
    const sprite = this.add.sprite(x, y, pieceTextureKey(piece.type));
    sprite.setDisplaySize(this.cellSize * PIECE_SCALE, this.cellSize * PIECE_SCALE);
    return sprite;
  }

  private renderFullBoard(fade: boolean): void {
    const oldSprites = [...this.spriteById.values()];
    this.spriteById.clear();
    this.pieceIdAt.clear();

    const buildFresh = (): void => {
      for (let row = 0; row < this.level.height; row++) {
        for (let col = 0; col < this.level.width; col++) {
          const pos = { row, col };
          const piece = this.board.get(pos);
          const sprite = this.createSprite(piece, this.screenX(col), this.screenY(row));
          if (fade) sprite.setAlpha(0);
          this.spriteById.set(piece.id, sprite);
          this.pieceIdAt.set(key(pos), piece.id);
        }
      }
      if (fade) {
        for (const sprite of this.spriteById.values()) {
          this.tweens.add({ targets: sprite, alpha: 1, duration: RESHUFFLE_FADE_MS });
        }
      }
    };

    if (!fade) {
      oldSprites.forEach((sprite) => sprite.destroy());
      buildFresh();
      return;
    }

    if (oldSprites.length === 0) {
      buildFresh();
      return;
    }

    let remaining = oldSprites.length;
    for (const sprite of oldSprites) {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: RESHUFFLE_FADE_MS,
        onComplete: () => {
          sprite.destroy();
          remaining--;
          if (remaining === 0) buildFresh();
        },
      });
    }
  }

  private cellAt(worldX: number, worldY: number): Position | null {
    const col = Math.floor((worldX - this.originX) / this.cellSize);
    const row = Math.floor((worldY - this.originY) / this.cellSize);
    if (row < 0 || row >= this.level.height || col < 0 || col >= this.level.width) return null;
    return { row, col };
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.busy || this.levelOver || this.paused) return;
    const cell = this.cellAt(pointer.worldX, pointer.worldY);
    if (!cell) return;
    this.drag = { start: cell, startX: pointer.worldX, startY: pointer.worldY, resolved: false };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.busy || this.levelOver || this.paused || !this.drag || this.drag.resolved) return;

    const dx = pointer.worldX - this.drag.startX;
    const dy = pointer.worldY - this.drag.startY;
    const threshold = this.cellSize * DRAG_THRESHOLD_RATIO;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;

    this.drag.resolved = true;

    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const rowDelta = horizontal ? 0 : Math.sign(dy);
    const colDelta = horizontal ? Math.sign(dx) : 0;
    const target: Position = {
      row: this.drag.start.row + rowDelta,
      col: this.drag.start.col + colDelta,
    };

    if (
      target.row < 0 ||
      target.row >= this.level.height ||
      target.col < 0 ||
      target.col >= this.level.width
    ) {
      return;
    }

    this.attemptSwap(this.drag.start, target);
  }

  private onPointerUp(): void {
    this.drag = null;
  }

  private attemptSwap(a: Position, b: Position): void {
    this.busy = true;

    const idA = this.pieceIdAt.get(key(a));
    const idB = this.pieceIdAt.get(key(b));
    if (idA === undefined || idB === undefined) {
      this.busy = false;
      return;
    }
    const spriteA = this.spriteById.get(idA);
    const spriteB = this.spriteById.get(idB);
    if (!spriteA || !spriteB) {
      this.busy = false;
      return;
    }

    const aX = this.screenX(a.col);
    const aY = this.screenY(a.row);
    const bX = this.screenX(b.col);
    const bY = this.screenY(b.row);

    const matches = trySwap(this.board, a, b);

    this.tweens.add({
      targets: spriteA,
      x: bX,
      y: bY,
      duration: SWAP_DURATION_MS,
    });
    this.tweens.add({
      targets: spriteB,
      x: aX,
      y: aY,
      duration: SWAP_DURATION_MS,
      onComplete: () => {
        if (matches === null) {
          this.tweens.add({ targets: spriteA, x: aX, y: aY, duration: SWAP_DURATION_MS });
          this.tweens.add({
            targets: spriteB,
            x: bX,
            y: bY,
            duration: SWAP_DURATION_MS,
            onComplete: () => {
              this.busy = false;
            },
          });
          return;
        }

        this.pieceIdAt.set(key(a), idB);
        this.pieceIdAt.set(key(b), idA);
        this.movesRemaining--;
        this.emitMovesChanged();

        const steps = resolveCascade(this.board, matches);
        this.recordGoalProgress(steps);
        this.emitGoalProgress();

        void this.playCascade(steps).then(() => {
          if (this.isGoalMet()) {
            this.levelOver = true;
            emitGameEvent(GameEvents.LevelWin, { levelId: this.level.id });
          } else if (this.movesRemaining <= 0) {
            this.levelOver = true;
            emitGameEvent(GameEvents.LevelLose, { levelId: this.level.id });
          } else if (!hasValidMove(this.board)) {
            reshuffleUntilSolvable(this.board);
            this.renderFullBoard(true);
          }

          this.busy = false;
        });
      },
    });
  }

  private recordGoalProgress(steps: CascadeStep[]): void {
    const targets = this.level.goal.targets;
    for (const step of steps) {
      for (const { piece } of step.cleared) {
        if (targets[piece.type] === undefined) continue;
        this.goalProgress[piece.type] = (this.goalProgress[piece.type] ?? 0) + 1;
      }
    }
  }

  private isGoalMet(): boolean {
    const targets = this.level.goal.targets;
    return (Object.keys(targets) as PieceType[]).every(
      (type) => (this.goalProgress[type] ?? 0) >= (targets[type] ?? 0),
    );
  }

  private async playCascade(steps: CascadeStep[]): Promise<void> {
    for (const step of steps) {
      await this.playCascadeStep(step);
    }
  }

  private playCascadeStep(step: CascadeStep): Promise<void> {
    const tweenPromises: Promise<void>[] = [];

    for (const { position } of step.cleared) {
      const id = this.pieceIdAt.get(key(position));
      this.pieceIdAt.delete(key(position));
      if (id === undefined) continue;
      const sprite = this.spriteById.get(id);
      if (!sprite) continue;
      tweenPromises.push(
        new Promise((resolve) => {
          this.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: 0,
            duration: CLEAR_DURATION_MS,
            onComplete: () => {
              sprite.destroy();
              this.spriteById.delete(id);
              resolve();
            },
          });
        }),
      );
    }

    for (const fall of step.falls) {
      const id = this.pieceIdAt.get(key(fall.from));
      this.pieceIdAt.delete(key(fall.from));
      if (id === undefined) continue;
      this.pieceIdAt.set(key(fall.to), id);
      const sprite = this.spriteById.get(id);
      if (!sprite) continue;
      tweenPromises.push(
        new Promise((resolve) => {
          this.tweens.add({
            targets: sprite,
            x: this.screenX(fall.to.col),
            y: this.screenY(fall.to.row),
            duration: FALL_DURATION_MS,
            onComplete: () => resolve(),
          });
        }),
      );
    }

    const byColumn = new Map<number, SpawnedPiece[]>();
    for (const spawn of step.spawned) {
      const list = byColumn.get(spawn.position.col) ?? [];
      list.push(spawn);
      byColumn.set(spawn.position.col, list);
    }

    for (const list of byColumn.values()) {
      list.forEach((spawn, i) => {
        const startRow = i - list.length;
        const sprite = this.createSprite(
          spawn.piece,
          this.screenX(spawn.position.col),
          this.screenY(startRow),
        );
        this.spriteById.set(spawn.piece.id, sprite);
        this.pieceIdAt.set(key(spawn.position), spawn.piece.id);
        tweenPromises.push(
          new Promise((resolve) => {
            this.tweens.add({
              targets: sprite,
              y: this.screenY(spawn.position.row),
              duration: FALL_DURATION_MS,
              onComplete: () => resolve(),
            });
          }),
        );
      });
    }

    return Promise.all(tweenPromises).then(() => undefined);
  }
}
