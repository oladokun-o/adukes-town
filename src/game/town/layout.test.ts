import { describe, expect, it } from "vitest";
import { FARM_GRID_WIDTH } from "@/game/city/types";
import { gridToScreen, plotIdToGrid, plotIndexToGrid } from "@/game/town/layout";

describe("gridToScreen", () => {
  it("places the origin cell at screen (0, 0)", () => {
    expect(gridToScreen({ col: 0, row: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("moves right and down as col increases", () => {
    const a = gridToScreen({ col: 0, row: 0 });
    const b = gridToScreen({ col: 1, row: 0 });
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeGreaterThan(a.y);
  });

  it("moves left and down as row increases", () => {
    const a = gridToScreen({ col: 0, row: 0 });
    const b = gridToScreen({ col: 0, row: 1 });
    expect(b.x).toBeLessThan(a.x);
    expect(b.y).toBeGreaterThan(a.y);
  });
});

describe("plotIndexToGrid", () => {
  it("fills a row before wrapping to the next", () => {
    expect(plotIndexToGrid(0)).toEqual({ col: 0, row: 0 });
    expect(plotIndexToGrid(FARM_GRID_WIDTH - 1)).toEqual({ col: FARM_GRID_WIDTH - 1, row: 0 });
    expect(plotIndexToGrid(FARM_GRID_WIDTH)).toEqual({ col: 0, row: 1 });
  });
});

describe("plotIdToGrid", () => {
  it("parses plot-N ids 1-indexed", () => {
    expect(plotIdToGrid("plot-1")).toEqual({ col: 0, row: 0 });
    expect(plotIdToGrid("plot-2")).toEqual({ col: 1, row: 0 });
  });

  it("returns null for a non-plot id", () => {
    expect(plotIdToGrid("factory")).toBeNull();
  });

  it("agrees with plotIndexToGrid", () => {
    expect(plotIdToGrid("plot-7")).toEqual(plotIndexToGrid(6));
  });
});
