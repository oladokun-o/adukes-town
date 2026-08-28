// What each player level grants, plus the economy tunables that used to be
// loose constants in types.ts. Phase 0 seeds only the first few levels;
// later phases extend UNLOCKS toward Township parity (~40 levels).

export interface LevelUnlock {
  crops?: string[];
  factories?: string[];
  recipes?: string[];
  // Highest plot index auto-considered "available to buy" at this level.
  plotsUnlockedTo?: number;
  // Barn capacity floor at this level (monotonic — see barnCapacityForLevel).
  barnCapacity?: number;
}

export const STARTING_BARN_CAPACITY = 50;

// XP curve: cumulative XP to *reach* level N is the running sum of
// round(XP_BASE * XP_GROWTH^(k-1)) for k in 1..N-1. Level 1 costs 0.
export const XP_BASE = 50;
export const XP_GROWTH = 1.3;
export const MAX_LEVEL = 200;

// Plot layout: ordered plot ids. plot-1 starts unlocked; the rest are
// bought with coins (buyPlot), gated by PLOT_UNLOCK_LEVEL.
export const PLOT_LAYOUT: string[] = ["plot-1", "plot-2"];
export const PLOT_COSTS: Record<string, number> = { "plot-2": 50 };
export const PLOT_UNLOCK_LEVEL: Record<string, number> = { "plot-2": 1 };

export const UNLOCKS: Record<number, LevelUnlock> = {
  1: {
    crops: ["wheat"],
    factories: ["bakery"],
    recipes: ["bread"],
    plotsUnlockedTo: 1,
    barnCapacity: 50,
  },
  2: { barnCapacity: 75 },
  3: { plotsUnlockedTo: 2, barnCapacity: 100 },
};
