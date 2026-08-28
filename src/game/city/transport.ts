import { PLANE_TRIP_MS, TRAIN_TRIP_MS } from "@/game/city/catalog";
import type { PlaneState, TrainState } from "@/game/city/types";

// Pure trip-status queries for the train and plane.

export function trainRemainingMs(train: TrainState, now: number): number {
  return train.departedAt === null ? 0 : Math.max(0, train.departedAt + TRAIN_TRIP_MS - now);
}

export function trainBack(train: TrainState, now: number): boolean {
  return train.departedAt !== null && now - train.departedAt >= TRAIN_TRIP_MS;
}

export function planeRemainingMs(plane: PlaneState, now: number): number {
  return plane.departedAt === null ? 0 : Math.max(0, plane.departedAt + PLANE_TRIP_MS - now);
}

export function planeBack(plane: PlaneState, now: number): boolean {
  return plane.departedAt !== null && now - plane.departedAt >= PLANE_TRIP_MS;
}
