import type { PieceType } from "@/game/board/types";

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function progressKey(levelId: string): string {
  return `adukes-town:progress:${levelId}`;
}

export function getStoredProgress(
  levelId: string,
  storage: ProgressStorage = localStorage,
): Partial<Record<PieceType, number>> {
  const raw = storage.getItem(progressKey(levelId));
  if (raw === null) return {};
  try {
    return JSON.parse(raw) as Partial<Record<PieceType, number>>;
  } catch {
    return {};
  }
}

export function storeProgress(
  levelId: string,
  progress: Partial<Record<PieceType, number>>,
  storage: ProgressStorage = localStorage,
): void {
  storage.setItem(progressKey(levelId), JSON.stringify(progress));
}

export function clearProgress(levelId: string, storage: ProgressStorage = localStorage): void {
  storage.removeItem(progressKey(levelId));
}
