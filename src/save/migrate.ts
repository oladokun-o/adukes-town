import { createDefaultCityState, type CityState } from "@/game/city/types";
import {
  SCHEMA_VERSION,
  type AnySaveBundle,
  type CityStateV1,
  type SaveBundle,
} from "@/save/saveBundleSchema";

// Forward migration for both persisted forms: the bare `city:state`
// IndexedDB blob (which historically had no version marker) and the
// SaveBundle file/cloud blob. Everything funnels through migrateCityState,
// which is idempotent — a v2 value in, a normalized v2 value out.

interface CityEnvelope {
  schemaVersion: number;
  state: unknown;
}

function isEnvelope(raw: unknown): raw is CityEnvelope {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "schemaVersion" in raw &&
    "state" in raw &&
    typeof (raw as CityEnvelope).schemaVersion === "number"
  );
}

function isV2CityState(raw: unknown): raw is Partial<CityState> {
  return typeof raw === "object" && raw !== null && "inventory" in raw && "level" in raw;
}

function isV1CityState(raw: unknown): raw is CityStateV1 {
  return typeof raw === "object" && raw !== null && "cropInventory" in raw && "factory" in raw;
}

function normalizeV2(raw: Partial<CityState>): CityState {
  const base = createDefaultCityState();
  return {
    ...base,
    ...raw,
    inventory: raw.inventory ?? {},
    plots: raw.plots?.length ? raw.plots : base.plots,
    factories: raw.factories?.length ? raw.factories : base.factories,
    orders: raw.orders?.length ? raw.orders : base.orders,
    level: raw.level ?? 1,
    xp: raw.xp ?? 0,
    barnCapacity: raw.barnCapacity ?? base.barnCapacity,
  };
}

function v1ToV2(v1: CityStateV1): CityState {
  const base = createDefaultCityState();
  // Carry the starter seeds so a v1 player with no coins isn't stranded
  // once planting costs a seed (Phase 1).
  const inventory: Record<string, number> = { ...base.inventory };
  if (v1.cropInventory > 0) inventory.crop_wheat = v1.cropInventory;
  if (v1.goodsInventory > 0) inventory.good_bread = v1.goodsInventory;

  return {
    ...base,
    coins: v1.coins ?? 0,
    inventory,
    plots: v1.plots?.length
      ? v1.plots.map((p) => ({
          id: p.id,
          unlocked: p.unlocked,
          planting: p.crop ? { cropId: "wheat", timer: p.crop } : null,
        }))
      : base.plots,
    factories: [
      {
        id: "bakery",
        batch: v1.factory?.batch ? { recipeId: "bread", timer: v1.factory.batch } : null,
      },
    ],
    lastPlayedLevelId: v1.lastPlayedLevelId ?? null,
  };
}

export function migrateCityState(raw: unknown): CityState {
  if (isEnvelope(raw)) return migrateCityState(raw.state);
  if (isV2CityState(raw)) return normalizeV2(raw);
  if (isV1CityState(raw)) return v1ToV2(raw);
  return createDefaultCityState();
}

export function migrateSaveBundle(raw: AnySaveBundle): SaveBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: raw.progress ?? {},
    relaxMode: raw.relaxMode ?? false,
    city: migrateCityState(raw.city),
  };
}
