import type { Timer } from "@/game/city/types";

export function startTimer(now: number, durationMs: number): Timer {
  return { startedAt: now, readyAt: now + durationMs };
}

export function isReady(timer: Timer | null, now: number): boolean {
  return timer !== null && now >= timer.readyAt;
}

export function remainingMs(timer: Timer | null, now: number): number {
  return timer === null ? 0 : Math.max(0, timer.readyAt - now);
}
