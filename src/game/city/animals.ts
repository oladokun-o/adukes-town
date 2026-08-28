import { getAnimalPen } from "@/game/city/catalog";
import type { AnimalPenRuntime } from "@/game/city/types";

// Pure queries over an animal pen's single feed-and-collect cycle.

export function emptyPen(): AnimalPenRuntime {
  return { startedAt: null };
}

export function isFed(pen: AnimalPenRuntime): boolean {
  return pen.startedAt !== null;
}

export function isPenReady(penId: string, pen: AnimalPenRuntime, now: number): boolean {
  const def = getAnimalPen(penId);
  return def !== undefined && pen.startedAt !== null && now - pen.startedAt >= def.produceMs;
}

export function penRemainingMs(penId: string, pen: AnimalPenRuntime, now: number): number {
  const def = getAnimalPen(penId);
  if (!def || pen.startedAt === null) return 0;
  return Math.max(0, pen.startedAt + def.produceMs - now);
}
