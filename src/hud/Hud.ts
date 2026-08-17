import type { PieceType } from "@/game/board/types";
import {
  GameEvents,
  onGameEvent,
  emitGameEvent,
  type GoalProgressPayload,
  type MovesChangedPayload,
} from "@/game/events";

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Hud: missing #${id} element`);
  return el as T;
}

function formatGoal(payload: GoalProgressPayload): string {
  const types = Object.keys(payload.targets) as PieceType[];
  return types
    .map((type) => `${type} ${payload.progress[type] ?? 0}/${payload.targets[type]}`)
    .join(" · ");
}

export class Hud {
  private movesEl = requireElement<HTMLSpanElement>("moves");
  private goalEl = requireElement<HTMLSpanElement>("goal");
  private pauseBtn = requireElement<HTMLButtonElement>("pause-btn");
  private pauseOverlay = requireElement<HTMLDivElement>("pause-overlay");
  private resumeBtn = requireElement<HTMLButtonElement>("resume-btn");
  private resultModal = requireElement<HTMLDivElement>("result-modal");
  private resultTitle = requireElement<HTMLHeadingElement>("result-title");
  private playAgainBtn = requireElement<HTMLButtonElement>("play-again-btn");
  private paused = false;

  constructor(private readonly restartLevel: () => void) {
    this.pauseBtn.addEventListener("click", () => this.togglePause());
    this.resumeBtn.addEventListener("click", () => this.togglePause());
    this.playAgainBtn.addEventListener("click", () => {
      this.resultModal.hidden = true;
      this.restartLevel();
    });

    onGameEvent(GameEvents.MovesChanged, this.onMovesChanged, this);
    onGameEvent(GameEvents.GoalProgress, this.onGoalProgress, this);
    onGameEvent(GameEvents.LevelWin, this.onLevelWin, this);
    onGameEvent(GameEvents.LevelLose, this.onLevelLose, this);
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.pauseOverlay.hidden = !this.paused;
    emitGameEvent(GameEvents.PauseToggle);
  }

  private onMovesChanged = (payload: MovesChangedPayload): void => {
    this.movesEl.textContent = `${payload.movesRemaining} / ${payload.moveLimit}`;
  };

  private onGoalProgress = (payload: GoalProgressPayload): void => {
    this.goalEl.textContent = formatGoal(payload);
  };

  private onLevelWin = (): void => {
    this.resultTitle.textContent = "You Win!";
    this.resultModal.hidden = false;
  };

  private onLevelLose = (): void => {
    this.resultTitle.textContent = "Level Failed";
    this.resultModal.hidden = false;
  };
}
