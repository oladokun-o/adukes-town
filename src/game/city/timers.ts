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

export type CropStage = "sprout" | "growing" | "full";

// Shared by CropPlot.svelte and TownScene so the two renderers of the same
// crop never disagree about what stage it's showing.
export function cropStage(crop: Timer | null, now: number): CropStage | null {
  if (crop === null) return null;
  if (isReady(crop, now)) return "full";
  const fraction = (now - crop.startedAt) / (crop.readyAt - crop.startedAt);
  return fraction >= 0.5 ? "growing" : "sprout";
}
