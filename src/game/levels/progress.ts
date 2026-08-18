import type { PieceType } from "@/game/board/types";
import { idbDelete, idbGet, idbSet } from "@/save/db";

type LevelProgress = Partial<Record<PieceType, number>>;

function idbKey(levelId: string): string {
  return `progress:${levelId}`;
}

// Phaser's scene lifecycle reads progress synchronously in `init()`, but
// IndexedDB is inherently async — so this cache is the source of truth for
// reads/writes, hydrated from IndexedDB once at app bootstrap (see
// `loadProgressFromDb`) and written through on every change. Tests inject a
// throwaway Map instead, which skips IndexedDB entirely and stays synchronous.
const defaultCache = new Map<string, LevelProgress>();

export function getStoredProgress(
  levelId: string,
  cache: Map<string, LevelProgress> = defaultCache,
): LevelProgress {
  return cache.get(levelId) ?? {};
}

export async function storeProgress(
  levelId: string,
  progress: LevelProgress,
  cache: Map<string, LevelProgress> = defaultCache,
): Promise<void> {
  cache.set(levelId, progress);
  if (cache === defaultCache) await idbSet(idbKey(levelId), progress);
}

export async function clearProgress(
  levelId: string,
  cache: Map<string, LevelProgress> = defaultCache,
): Promise<void> {
  cache.delete(levelId);
  if (cache === defaultCache) await idbDelete(idbKey(levelId));
}

// Call once at app bootstrap, before any scene reads progress.
export async function loadProgressFromDb(levelIds: string[]): Promise<void> {
  await Promise.all(
    levelIds.map(async (levelId) => {
      const stored = await idbGet<LevelProgress>(idbKey(levelId));
      if (stored) defaultCache.set(levelId, stored);
    }),
  );
}
