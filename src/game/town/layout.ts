import { FARM_GRID_WIDTH } from "@/game/city/types";

// Isometric grid math for the town view. Tiles are Kenney's "Isometric
// Miniature" series — 256x512px images, with the diamond ground footprint
// sitting at the bottom of that canvas (the rest is headroom for whatever
// stands on the tile). TownScene places sprites with origin (0.5, 1) —
// bottom-center — so a sprite's bottom-center point should land on the
// screen point returned here.
export const TILE_WIDTH = 256;
export const TILE_HEIGHT = 128; // the diamond's on-screen height

export interface GridPosition {
  col: number;
  row: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function gridToScreen({ col, row }: GridPosition): ScreenPoint {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  };
}

// Plot ids are "plot-N" (1-indexed, see createDefaultCityState). Position is
// derived from the id rather than stored on PlotState — growing the farm
// later is just raising FARM_GRID_WIDTH/HEIGHT, no save migration.
export function plotIndexToGrid(index: number): GridPosition {
  return {
    col: index % FARM_GRID_WIDTH,
    row: Math.floor(index / FARM_GRID_WIDTH),
  };
}

const PLOT_ID_PATTERN = /^plot-(\d+)$/;

export function plotIdToGrid(plotId: string): GridPosition | null {
  const match = PLOT_ID_PATTERN.exec(plotId);
  if (!match) return null;
  return plotIndexToGrid(Number(match[1]) - 1);
}

// Fixed positions for the non-plot buildings, placed one column past the
// farm grid's edge so they read as distinct from the crop plots rather than
// overlapping them. Spaced 3 rows apart (not 2) — the barn and Dapo's house
// are tall (wall + roof), and their tap targets extend a bit above their
// ground tile (see TownScene's WALL_HIT_AREA), so they need real room.
export const BARN_GRID_POSITION: GridPosition = { col: FARM_GRID_WIDTH, row: 0 };
export const ORDER_BOOTH_GRID_POSITION: GridPosition = { col: FARM_GRID_WIDTH, row: 3 };
export const DAPO_HOUSE_GRID_POSITION: GridPosition = { col: FARM_GRID_WIDTH, row: 6 };
