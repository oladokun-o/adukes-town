// The farm grid's on-screen shape. Grid position (col/row) for a plot is
// derived from its index (see layout.ts), not stored on PlotState, so
// growing the farm later is just adding more plot ids to the catalog —
// no save migration. Width controls how many plots sit in a row before
// wrapping; height is headroom for the isometric camera framing.
export const FARM_GRID_WIDTH = 4;
export const FARM_GRID_HEIGHT = 6;
