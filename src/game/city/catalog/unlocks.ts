// What each player level grants, plus the economy tunables that used to be
// loose constants in types.ts. Extended toward Township parity as phases
// land; balance pass is Phase 9.

export interface LevelUnlock {
  crops?: string[];
  factories?: string[];
  recipes?: string[];
  pens?: string[];
  // Highest plot index considered "available to buy" at this level.
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

// Field plots: ordered ids. plot-1 starts unlocked; the rest are bought
// with coins (buyPlot), gated by PLOT_UNLOCK_LEVEL. Rising cost curve.
const PLOT_SPECS: { cost: number; unlockLevel: number }[] = [
  { cost: 0, unlockLevel: 1 }, // plot-1, free, pre-unlocked
  { cost: 50, unlockLevel: 1 },
  { cost: 100, unlockLevel: 1 },
  { cost: 200, unlockLevel: 2 },
  { cost: 350, unlockLevel: 2 },
  { cost: 550, unlockLevel: 3 },
  { cost: 800, unlockLevel: 4 },
  { cost: 1200, unlockLevel: 5 },
  { cost: 1800, unlockLevel: 6 },
  { cost: 2600, unlockLevel: 8 },
  { cost: 3800, unlockLevel: 10 },
  { cost: 5500, unlockLevel: 12 },
];

export const PLOT_LAYOUT: string[] = PLOT_SPECS.map((_, i) => `plot-${i + 1}`);
export const PLOT_COSTS: Record<string, number> = Object.fromEntries(
  PLOT_SPECS.map((s, i) => [`plot-${i + 1}`, s.cost]).filter(([, cost]) => (cost as number) > 0),
);
export const PLOT_UNLOCK_LEVEL: Record<string, number> = Object.fromEntries(
  PLOT_SPECS.map((s, i) => [`plot-${i + 1}`, s.unlockLevel]),
);

export const UNLOCKS: Record<number, LevelUnlock> = {
  1: {
    crops: ["wheat"],
    factories: ["mill", "bakery"],
    recipes: ["flour", "bread"],
    plotsUnlockedTo: 3,
    barnCapacity: 50,
  },
  2: {
    crops: ["corn"],
    factories: ["feed_mill"],
    recipes: ["feed"],
    plotsUnlockedTo: 5,
    barnCapacity: 75,
  },
  3: {
    crops: ["carrot"],
    recipes: ["cornbread", "cookies"],
    pens: ["chicken_coop"],
    plotsUnlockedTo: 6,
    barnCapacity: 100,
  },
  4: {
    crops: ["sugarcane"],
    factories: ["sugar_mill"],
    recipes: ["sugar"],
    plotsUnlockedTo: 7,
    barnCapacity: 125,
  },
  5: {
    crops: ["cotton"],
    factories: ["textile_mill"],
    recipes: ["thread", "fabric"],
    pens: ["cow_pasture"],
    plotsUnlockedTo: 8,
    barnCapacity: 150,
  },
  6: {
    crops: ["strawberry"],
    factories: ["juice_press", "tailor", "dairy"],
    recipes: ["juice", "sunhat", "butter", "cheese"],
    plotsUnlockedTo: 9,
    barnCapacity: 175,
  },
  7: {
    crops: ["tomato"],
    factories: ["cannery"],
    recipes: ["tomato_sauce", "yarn", "sweater"],
    pens: ["sheep_pen"],
    barnCapacity: 200,
  },
  8: {
    crops: ["potato"],
    factories: ["kitchen"],
    recipes: ["veggie_soup"],
    plotsUnlockedTo: 10,
    barnCapacity: 250,
  },
  9: { factories: ["confectionery"], recipes: ["cake", "jam"], barnCapacity: 275 },
  10: { crops: ["pumpkin"], plotsUnlockedTo: 11, barnCapacity: 300 },
  12: {
    crops: ["cacao"],
    factories: ["chocolate_maker"],
    recipes: ["chocolate", "choc_cake"],
    plotsUnlockedTo: 12,
    barnCapacity: 375,
  },
};
