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
  TownFx: "town:fx",
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

export type TownTileKind =
  | "plot"
  | "factory"
  | "order"
  | "market"
  | "animal"
  | "train"
  | "plane"
  | "barn"
  | "build"
  | "mine"
  | "zoo"
  | "harbor"
  | "achievements"
  | "npc";

export interface TownTileTappedPayload {
  kind: TownTileKind;
  id: string;
}

// A visual flourish to play at a town tile after an action lands — driven
// from cityStore so TownScene stays unaware of the economy.
export type TownFxKind = "harvest" | "collect" | "reward" | "build";

export interface TownFxPayload {
  kind: TownFxKind;
  // A plot id, building id, or "building:<id>:<n>" — matched against the
  // sprites TownScene drew on its last render.
  id: string;
  // Floating label, e.g. "+3 🌾".
  text?: string;
}

interface GameEventPayloads {
  [GameEvents.MovesChanged]: MovesChangedPayload;
  [GameEvents.GoalProgress]: GoalProgressPayload;
  [GameEvents.LevelWin]: LevelWinPayload;
  [GameEvents.LevelLose]: LevelLosePayload;
  [GameEvents.PauseToggle]: undefined;
  [GameEvents.TownTileTapped]: TownTileTappedPayload;
  [GameEvents.TownFx]: TownFxPayload;
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
