import { describe, expect, it } from "vitest";
import { STARTING_BARN_CAPACITY } from "@/game/city/catalog";
import { createDefaultCityState } from "@/game/city/types";

describe("createDefaultCityState", () => {
  it("starts with just starter seeds, no coins, level 1, and no XP", () => {
    const state = createDefaultCityState();
    expect(state.coins).toBe(0);
    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
    expect(state.inventory).toEqual({ seed_wheat: 8 });
    expect(state.barnCapacity).toBe(STARTING_BARN_CAPACITY);
    expect(state.lastPlayedLevelId).toBeNull();
  });

  it("starts with one unlocked plot, the rest locked, all empty", () => {
    const state = createDefaultCityState();
    expect(state.plots[0]).toEqual({ id: "plot-1", unlocked: true, planting: null });
    expect(state.plots.slice(1).every((p) => !p.unlocked && p.planting === null)).toBe(true);
  });

  it("starts with no factory queues and a full helicopter board", () => {
    const state = createDefaultCityState();
    expect(state.factories).toEqual({});
    expect(state.orders).toHaveLength(6);
    expect(new Set(state.orders.map((o) => o.seed)).size).toBe(6);
    expect(Object.keys(state.orders[0].requires).length).toBeGreaterThan(0);
    expect(state.train.wagons).toHaveLength(3);
    expect(state.plane.manifest.requires).toBeTruthy();
    expect(state.materials).toEqual({});
  });

  it("returns an independent object each call, safe to mutate", () => {
    const a = createDefaultCityState();
    const b = createDefaultCityState();
    a.coins = 100;
    a.plots[0].planting = { cropId: "wheat", timer: { startedAt: 0, readyAt: 1 } };
    a.inventory.crop_wheat = 5;
    expect(b.coins).toBe(0);
    expect(b.plots[0].planting).toBeNull();
    expect(b.inventory).toEqual({ seed_wheat: 8 });
  });
});
