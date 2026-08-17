import type { PieceType } from "@/game/board/types";
import {
  GameEvents,
  onGameEvent,
  emitGameEvent,
  type GoalProgressPayload,
  type LevelLosePayload,
  type MovesChangedPayload,
} from "@/game/events";
import { isRelaxModeEnabled, setRelaxModeEnabled } from "@/settings/relaxMode";

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
  private resultProgress = requireElement<HTMLParagraphElement>("result-progress");
  private playAgainBtn = requireElement<HTMLButtonElement>("play-again-btn");
  private relaxModeToggle = requireElement<HTMLInputElement>("relax-mode-toggle");
  private paused = false;

  constructor(private readonly restartLevel: () => void) {
    this.pauseBtn.addEventListener("click", () => this.togglePause());
    this.resumeBtn.addEventListener("click", () => this.togglePause());
    this.playAgainBtn.addEventListener("click", () => {
      this.resultModal.hidden = true;
      this.restartLevel();
    });
    this.relaxModeToggle.addEventListener("change", () => {
      setRelaxModeEnabled(this.relaxModeToggle.checked);
    });

    onGameEvent(GameEvents.MovesChanged, this.onMovesChanged, this);
    onGameEvent(GameEvents.GoalProgress, this.onGoalProgress, this);
    onGameEvent(GameEvents.LevelWin, this.onLevelWin, this);
    onGameEvent(GameEvents.LevelLose, this.onLevelLose, this);
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.pauseOverlay.hidden = !this.paused;
    if (this.paused) this.relaxModeToggle.checked = isRelaxModeEnabled();
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
    this.resultProgress.textContent = "";
    this.resultModal.hidden = false;
  };

  private onLevelLose = (payload: LevelLosePayload): void => {
    this.resultTitle.textContent = "Level Failed";
    this.resultProgress.textContent = `Progress saved — ${formatGoal(payload)}`;
    this.resultModal.hidden = false;
  };
}
