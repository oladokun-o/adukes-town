import { FARM_GRID_WIDTH } from "@/game/town/config";

// Isometric grid math for the town view. Tiles are Kenney's "Isometric
// Tiles" family — a 132px-wide diamond footprint (2:1 iso, so 66px tall on
// screen). TownScene anchors every sprite so its footprint centre lands on
// the screen point returned here (per-texture origin, see ORIGIN_Y there).
export const TILE_WIDTH = 132;
export const TILE_HEIGHT = 66; // the diamond's on-screen height

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
// later is just adding plot ids / raising FARM_GRID_WIDTH, no save migration.
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
// overlapping them. Spaced 2 rows apart — the barn is tall (wall + roof)
// and its tap target extends above its ground tile (see TownScene's
// WALL_HIT_AREA), so it needs room.
const BUILDING_COL = FARM_GRID_WIDTH + 1; // one clear tile past the field
export const BARN_GRID_POSITION: GridPosition = { col: BUILDING_COL, row: 0 };
export const ORDER_BOOTH_GRID_POSITION: GridPosition = { col: BUILDING_COL, row: 2 };
export const MARKET_STALL_GRID_POSITION: GridPosition = { col: BUILDING_COL, row: 4 };
