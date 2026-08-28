import { describe, expect, it } from "vitest";
import {
  generateTrainWagon,
  PLANE_TRIP_MS,
  planeReward,
  TRAIN_TRIP_MS,
  trainReward,
} from "@/game/city/catalog";
import { freshPlane, freshTrain } from "@/game/city/types";
import { planeBack, planeRemainingMs, trainBack, trainRemainingMs } from "@/game/city/transport";

describe("trip status", () => {
  it("train: not back before the trip, back at/after it", () => {
    const train = { ...freshTrain(), departedAt: 1000 };
    expect(trainBack(train, 1000 + TRAIN_TRIP_MS - 1)).toBe(false);
    expect(trainBack(train, 1000 + TRAIN_TRIP_MS)).toBe(true);
    expect(trainRemainingMs(train, 1000)).toBe(TRAIN_TRIP_MS);
    expect(trainRemainingMs({ ...freshTrain(), departedAt: null }, 0)).toBe(0);
  });

  it("plane: same shape, longer trip", () => {
    const plane = { ...freshPlane(), departedAt: 0 };
    expect(planeBack(plane, PLANE_TRIP_MS - 1)).toBe(false);
    expect(planeBack(plane, PLANE_TRIP_MS)).toBe(true);
    expect(planeRemainingMs(plane, 0)).toBe(PLANE_TRIP_MS);
  });
});

describe("deterministic generation", () => {
  it("same seed → same wagon and reward", () => {
    expect(generateTrainWagon(7, 5)).toEqual(generateTrainWagon(7, 5));
    expect(trainReward(7, 5)).toEqual(trainReward(7, 5));
    expect(planeReward(9, 8)).toEqual(planeReward(9, 8));
  });

  it("rewards grant at least one material and positive coins/xp", () => {
    const r = trainReward(3, 4);
    expect(Object.keys(r.materials).length).toBeGreaterThan(0);
    expect(r.coins).toBeGreaterThan(0);
    expect(r.xp).toBeGreaterThan(0);
  });
});
