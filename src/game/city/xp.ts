import { barnCapacityForLevel, MAX_LEVEL, XP_BASE, XP_GROWTH } from "@/game/city/catalog";
import type { CityState } from "@/game/city/types";

// Cumulative XP required to *reach* `level`. Level 1 is free.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let k = 1; k < Math.min(level, MAX_LEVEL); k++) {
    total += Math.round(XP_BASE * Math.pow(XP_GROWTH, k - 1));
  }
  return total;
}

// Inverse of xpForLevel, clamped to [1, MAX_LEVEL].
export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

// Progress within the current level, for the XP bar.
export function xpIntoLevel(xp: number): { current: number; needed: number } {
  const level = levelForXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { current: xp - base, needed: Math.max(1, next - base) };
}

// Pure. `amount <= 0` returns the same reference. On a gain, recomputes
// level and raises barnCapacity to the new level's floor (never shrinks —
// leaves room for a future paid barn upgrade to sit on top).
export function applyXpGain(state: CityState, amount: number): CityState {
  if (amount <= 0) return state;
  const xp = state.xp + amount;
  const level = levelForXp(xp);
  const barnCapacity = Math.max(state.barnCapacity, barnCapacityForLevel(level));
  return { ...state, xp, level, barnCapacity };
}
