import Phaser from "phaser";
import { Board } from "@/game/board/Board";
import { resolveCascade } from "@/game/board/cascade";
import { hasValidMove, reshuffleUntilSolvable } from "@/game/board/noDeadEnd";
import { trySwap } from "@/game/board/swap";
import type {
  CascadeStep,
  FallMovement,
  Piece,
  PieceType,
  Position,
  SpawnedPiece,
} from "@/game/board/types";
import {
  playMatchPop,
  playSpecialCreate,
  playSpecialTrigger,
  resumeAudioContext,
} from "@/game/audio/juiceSounds";
import { emitGameEvent, GameEvents, offGameEvent, onGameEvent } from "@/game/events";
import { getLevelById } from "@/game/levels";
import { clearProgress, getStoredProgress, storeProgress } from "@/game/levels/progress";
import type { LevelDef } from "@/game/levels/types";
import {
  ensureParticleTexture,
  ensurePieceTextures,
  PARTICLE_TEXTURE_KEY,
  PIECE_COLORS,
  pieceTextureKey,
} from "@/game/scenes/pieceTextures";
import { applyRelaxMode, isRelaxModeEnabled } from "@/settings/relaxMode";

const PIECE_TEXTURE_SIZE = 160;
const PARTICLE_TEXTURE_SIZE = 16;
const BOARD_MARGIN = 0.86;
const PIECE_SCALE = 0.9;
const SWAP_DURATION_MS = 150;
const CLEAR_DURATION_MS = 150;
const SPECIAL_CLEAR_DURATION_MS = 320;
const CREATE_DURATION_MS = 220;
const FALL_DURATION_MS = 200;
const RESHUFFLE_FADE_MS = 200;
const DRAG_THRESHOLD_RATIO = 0.2;

const PARTICLE_COUNT = 8;
const SPECIAL_PARTICLE_COUNT = 16;
// Escalating juice across a cascade chain, per the research doc's "juice is
// the product, not decoration" — but a plain single 3-match (wave 0, no
// special) stays calm; the shake/pop only ramps up once a chain or a
// special is actually happening.
const SHAKE_BASE_DURATION_MS = 90;
const SHAKE_BASE_INTENSITY = 0.004;
const SHAKE_MAX_MULTIPLIER = 3;

function key(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

// Resolved pre-game booster effects, applied at scene init. Deliberately a
// plain data bag with no city imports — the city side (catalog/boosters.ts)
// produces this shape and passes it through the scene-launch data, keeping
// the board unaware of the economy (architecture principle: no direct
// match-3 ↔ city coupling outside the event bus / matchTie).
export interface BoardModifiers {
  extraMoves: number;
  headStart: number;
  startRainbow: number;
}

const NO_MODIFIERS: BoardModifiers = { extraMoves: 0, headStart: 0, startRainbow: 0 };

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
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private drag: DragState | null = null;
  private busy = false;
  private movesRemaining = 0;
  private effectiveMoveLimit = 0;
  private goalProgress: Partial<Record<PieceType, number>> = {};
  private levelOver = false;
  private paused = false;
  private modifiers: BoardModifiers = NO_MODIFIERS;

  constructor() {
    super("BoardScene");
  }

  init(data: { level?: LevelDef; modifiers?: BoardModifiers }): void {
    this.level = data.level ?? getLevelById("level001");
    this.modifiers = data.modifiers ?? NO_MODIFIERS;
    this.effectiveMoveLimit =
      applyRelaxMode(this.level.moveLimit, isRelaxModeEnabled()) + this.modifiers.extraMoves;
    this.movesRemaining = this.effectiveMoveLimit;
    this.goalProgress = { ...getStoredProgress(this.level.id) };
    // Head-start booster: seed goal progress (never above the target).
    if (this.modifiers.headStart > 0) {
      for (const type of Object.keys(this.level.goal.targets) as PieceType[]) {
        const target = this.level.goal.targets[type] ?? 0;
        this.goalProgress[type] = Math.min(
          target,
          (this.goalProgress[type] ?? 0) + this.modifiers.headStart,
        );
      }
    }
    this.levelOver = false;
    this.paused = false;
  }

  create(): void {
    this.drawScenery();
    ensurePieceTextures(this, PIECE_TEXTURE_SIZE);
    ensureParticleTexture(this, PARTICLE_TEXTURE_SIZE);
    this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE_KEY, {
      lifespan: 400,
      speed: { min: 80, max: 220 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: -1, // explode-only; never emits on its own
    });

    this.board = new Board(this.level.width, this.level.height, this.level.colorCount);
    this.board.refill();
    reshuffleUntilSolvable(this.board);
    this.applyStartingSpecials();

    this.computeLayout();
    this.drawBoardTray();
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

  // Rainbow-start booster: convert a few random interior pieces into
  // RainbowBalls before the first render. Interior only so a stray edge
  // match on spawn doesn't immediately consume them.
  private applyStartingSpecials(): void {
    const want = this.modifiers.startRainbow;
    if (want <= 0 || this.level.width < 3 || this.level.height < 3) return;
    const spots: Position[] = [];
    for (let row = 1; row < this.level.height - 1; row++) {
      for (let col = 1; col < this.level.width - 1; col++) spots.push({ row, col });
    }
    Phaser.Utils.Array.Shuffle(spots);
    for (const pos of spots.slice(0, want)) {
      const piece = this.board.get(pos);
      this.board.set(pos, { ...piece, special: "RainbowBall" });
    }
  }

  private emitMovesChanged(): void {
    emitGameEvent(GameEvents.MovesChanged, {
      movesRemaining: this.movesRemaining,
      moveLimit: this.effectiveMoveLimit,
    });
  }

  private emitGoalProgress(): void {
    emitGameEvent(GameEvents.GoalProgress, {
      targets: this.level.goal.targets,
      progress: this.goalProgress,
    });
  }

  // A warm focused backdrop — deep plum gradient with a soft glow behind
  // where the board will sit — so the pieces read as candy on a table
  // rather than shapes on a void. Pinned to the camera; drawn once.
  private drawScenery(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(-1000);
    bg.fillGradientStyle(0x4a3357, 0x4a3357, 0x271b31, 0x271b31, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0xffe9c7, 0.12);
    bg.fillCircle(w / 2, h / 2, Math.min(w, h) * 0.55);
    bg.fillStyle(0x000000, 0.22);
    bg.fillCircle(w / 2, h * 1.15, w * 0.9);
  }

  // The board tray: a rounded cream panel with a checkered set of cell
  // sockets, behind the pieces.
  private drawBoardTray(): void {
    const bw = this.cellSize * this.level.width;
    const bh = this.cellSize * this.level.height;
    const pad = Math.round(this.cellSize * 0.34);
    const x = this.originX - pad;
    const y = this.originY - pad;
    const w = bw + pad * 2;
    const h = bh + pad * 2;

    const tray = this.add.graphics().setDepth(-20);
    tray.fillStyle(0x000000, 0.28);
    tray.fillRoundedRect(x + 6, y + 12, w, h, 26);
    tray.fillStyle(0xcbac82, 1);
    tray.fillRoundedRect(x, y, w, h, 26);
    tray.fillStyle(0xf5e7cd, 1);
    tray.fillRoundedRect(x + 6, y + 6, w - 12, h - 12, 20);

    const sockets = this.add.graphics().setDepth(-15);
    const inset = Math.round(this.cellSize * 0.08);
    for (let row = 0; row < this.level.height; row++) {
      for (let col = 0; col < this.level.width; col++) {
        sockets.fillStyle((row + col) % 2 === 0 ? 0xe9d5b4 : 0xe1c9a3, 1);
        sockets.fillRoundedRect(
          this.originX + col * this.cellSize + inset,
          this.originY + row * this.cellSize + inset,
          this.cellSize - inset * 2,
          this.cellSize - inset * 2,
          Math.round(this.cellSize * 0.22),
        );
      }
    }
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
    const sprite = this.add.sprite(x, y, pieceTextureKey(piece));
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
    // Browsers block audio until a user gesture; the first pointer-down of
    // the session is as good a gesture as any to unblock it.
    resumeAudioContext();

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
    // Callers (onPointerMove) already gate on `busy`, but that's not a
    // guarantee against re-entrancy — without this, a swap started while
    // another is still animating corrupts pieceIdAt/spriteById (two
    // concurrent swaps racing to update the same maps), which shows up as
    // duplicate sprites in a cell and `busy` getting stuck true forever
    // (the losing animation's promise chain never resolves).
    if (this.busy) return;
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

        const steps = resolveCascade(this.board, matches, [a, b]);
        this.recordGoalProgress(steps);
        this.emitGoalProgress();

        void this.playCascade(steps).then(() => {
          if (this.isGoalMet()) {
            this.levelOver = true;
            clearProgress(this.level.id).catch((err: unknown) => {
              console.warn("Aduke's Town: couldn't clear saved progress.", err);
            });
            emitGameEvent(GameEvents.LevelWin, {
              levelId: this.level.id,
              movesRemaining: this.movesRemaining,
            });
          } else if (this.movesRemaining <= 0) {
            this.levelOver = true;
            storeProgress(this.level.id, this.goalProgress).catch((err: unknown) => {
              console.warn("Aduke's Town: couldn't save progress.", err);
            });
            emitGameEvent(GameEvents.LevelLose, {
              levelId: this.level.id,
              progress: this.goalProgress,
              targets: this.level.goal.targets,
            });
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
    for (const [waveIndex, step] of steps.entries()) {
      await this.playCascadeStep(step, waveIndex);
    }
  }

  private playCascadeStep(step: CascadeStep, waveIndex: number): Promise<void> {
    const tweenPromises: Promise<void>[] = [];
    let hasSpecialCleared = false;

    for (const { position, piece } of step.cleared) {
      const id = this.pieceIdAt.get(key(position));
      this.pieceIdAt.delete(key(position));
      if (id === undefined) continue;
      const sprite = this.spriteById.get(id);
      if (!sprite) continue;
      // A special piece triggering (row/column/block/color cleared) is the
      // "something big just happened" moment — give it a bigger, slower pop
      // than a plain match clear.
      const isSpecial = piece.special !== undefined;
      if (isSpecial) hasSpecialCleared = true;

      this.particles.setParticleTint(PIECE_COLORS[piece.type]);
      this.particles.explode(
        isSpecial ? SPECIAL_PARTICLE_COUNT : PARTICLE_COUNT,
        sprite.x,
        sprite.y,
      );

      tweenPromises.push(
        new Promise((resolve) => {
          this.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: isSpecial ? sprite.scale * 1.6 : 0,
            duration: isSpecial ? SPECIAL_CLEAR_DURATION_MS : CLEAR_DURATION_MS,
            ease: isSpecial ? "Cubic.easeOut" : "Linear",
            onComplete: () => {
              sprite.destroy();
              this.spriteById.delete(id);
              resolve();
            },
          });
        }),
      );
    }

    if (step.cleared.length > 0) {
      playMatchPop(waveIndex);
      if (hasSpecialCleared) playSpecialTrigger();
    }
    if (step.created.length > 0) playSpecialCreate();

    // A chain wave or a special triggering is the "something big is
    // happening" moment the shake is reserved for — a plain single 3-match
    // stays calm, per the "positive reinforcement, not punishment" note in
    // the match-3 research doc.
    if (waveIndex > 0 || hasSpecialCleared) {
      const multiplier = Math.min(
        1 + waveIndex * 0.4 + (hasSpecialCleared ? 0.6 : 0),
        SHAKE_MAX_MULTIPLIER,
      );
      this.cameras.main.shake(
        SHAKE_BASE_DURATION_MS * multiplier,
        SHAKE_BASE_INTENSITY * multiplier,
      );
    }

    for (const { position, piece } of step.created) {
      const id = this.pieceIdAt.get(key(position));
      if (id === undefined) continue;
      const sprite = this.spriteById.get(id);
      if (!sprite) continue;
      sprite.setTexture(pieceTextureKey(piece));
      const baseScale = sprite.scale;
      tweenPromises.push(
        new Promise((resolve) => {
          this.tweens.add({
            targets: sprite,
            scale: baseScale * 1.25,
            duration: CREATE_DURATION_MS,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => resolve(),
          });
        }),
      );
    }

    // A single step's falls can chain within one column (e.g. both (0,c)->(1,c)
    // and (1,c)->(2,c)), since each entry describes one survivor's shift, not
    // an atomic swap. Reading every `from` id before writing any `to` key
    // avoids an earlier fall's write clobbering a later fall's read of the
    // same position — doing it in a single pass corrupts pieceIdAt and
    // orphans a sprite (it stops being tracked, so it's never moved or
    // cleaned up again, and visually stacks with whatever ends up there).
    const fallMoves = step.falls
      .map((fall) => ({ fall, id: this.pieceIdAt.get(key(fall.from)) }))
      .filter((move): move is { fall: FallMovement; id: number } => move.id !== undefined);

    for (const { fall } of fallMoves) {
      this.pieceIdAt.delete(key(fall.from));
    }
    for (const { fall, id } of fallMoves) {
      this.pieceIdAt.set(key(fall.to), id);
    }

    for (const { fall, id } of fallMoves) {
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
