import Phaser from "phaser";
import type { PieceType } from "@/game/board/types";

// Shared event bus between BoardScene (Phaser) and Hud (plain DOM). Reuses
// Phaser's own EventEmitter so no extra pub/sub dependency is needed.
export const gameEvents = new Phaser.Events.EventEmitter();

export const GameEvents = {
  MovesChanged: "moves:changed",
  GoalProgress: "goal:progress",
  LevelWin: "level:win",
  LevelLose: "level:lose",
  PauseToggle: "pause:toggle",
  TownTileTapped: "town:tileTapped",
} as const;

export interface MovesChangedPayload {
  movesRemaining: number;
  moveLimit: number;
}

export interface GoalProgressPayload {
  targets: Partial<Record<PieceType, number>>;
  progress: Partial<Record<PieceType, number>>;
}

export interface LevelWinPayload {
  levelId: string;
  movesRemaining: number;
}

export interface LevelLosePayload {
  levelId: string;
  progress: Partial<Record<PieceType, number>>;
  targets: Partial<Record<PieceType, number>>;
}

export type TownTileKind = "plot" | "factory" | "order" | "market" | "animal";

export interface TownTileTappedPayload {
  kind: TownTileKind;
  id: string;
}

interface GameEventPayloads {
  [GameEvents.MovesChanged]: MovesChangedPayload;
  [GameEvents.GoalProgress]: GoalProgressPayload;
  [GameEvents.LevelWin]: LevelWinPayload;
  [GameEvents.LevelLose]: LevelLosePayload;
  [GameEvents.PauseToggle]: undefined;
  [GameEvents.TownTileTapped]: TownTileTappedPayload;
}

type EventArgs<K extends keyof GameEventPayloads> = GameEventPayloads[K] extends undefined
  ? []
  : [GameEventPayloads[K]];

type EventHandler<K extends keyof GameEventPayloads> = GameEventPayloads[K] extends undefined
  ? () => void
  : (payload: GameEventPayloads[K]) => void;

export function emitGameEvent<K extends keyof GameEventPayloads>(
  event: K,
  ...args: EventArgs<K>
): void {
  gameEvents.emit(event, ...args);
}

export function onGameEvent<K extends keyof GameEventPayloads>(
  event: K,
  handler: EventHandler<K>,
  context?: unknown,
): void {
  gameEvents.on(event, handler as (...args: unknown[]) => void, context);
}

export function offGameEvent<K extends keyof GameEventPayloads>(
  event: K,
  handler: EventHandler<K>,
  context?: unknown,
): void {
  gameEvents.off(event, handler as (...args: unknown[]) => void, context);
}
