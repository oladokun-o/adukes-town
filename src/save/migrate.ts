import { HELI_BOARD_SIZE } from "@/game/city/catalog";
import { emptyFactory } from "@/game/city/factory";
import {
  createDefaultCityState,
  freshHarbor,
  freshHeliBoard,
  freshPlane,
  freshTrain,
  type AnimalPenRuntime,
  type CityState,
  type FactoryRuntime,
} from "@/game/city/types";
import {
  SCHEMA_VERSION,
  type AnySaveBundle,
  type CityStateV1,
  type SaveBundle,
} from "@/save/saveBundleSchema";

// Forward migration for both persisted forms: the bare `city:state` blob
// (historically unversioned) and the SaveBundle file/cloud blob. Everything
// funnels through migrateCityState, which is idempotent — a current value
// in, a normalized current value out.
//
// Schema history: v1 = scalar economy; v2 = data-driven catalog + inventory
// map + XP/level + barn; v3 = per-factory production queue; v4 = animal pens
// (an `animals` { startedAt } map keyed by penId).

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

function isModernCityState(raw: unknown): raw is Partial<CityState> {
  return typeof raw === "object" && raw !== null && "inventory" in raw && "level" in raw;
}

function isV1CityState(raw: unknown): raw is CityStateV1 {
  return typeof raw === "object" && raw !== null && "cropInventory" in raw && "factory" in raw;
}

// Accepts: v3 map, v2 array of { id, batch }, or nothing.
function normalizeFactories(raw: unknown): Record<string, FactoryRuntime> {
  if (Array.isArray(raw)) {
    const out: Record<string, FactoryRuntime> = {};
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || typeof entry.id !== "string") continue;
      const batch = entry.batch as { recipeId: string; timer: { startedAt: number } } | null;
      out[entry.id] = batch
        ? { queue: [batch.recipeId], startedAt: batch.timer.startedAt }
        : emptyFactory();
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    const out: Record<string, FactoryRuntime> = {};
    for (const [id, f] of Object.entries(raw as Record<string, unknown>)) {
      if (f && typeof f === "object" && Array.isArray((f as FactoryRuntime).queue)) {
        const fr = f as FactoryRuntime;
        out[id] = { queue: fr.queue, startedAt: fr.startedAt ?? null };
      }
    }
    return out;
  }
  return {};
}

// Ensures every character slot exists (a new NPC added later is filled in
// with a fresh relationship on the next load).
function normalizeStory(raw: unknown, base: CityState["story"]): CityState["story"] {
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<CityState["story"]>;
  const characters = { ...base.characters };
  const incoming = (r.characters ?? {}) as Record<string, unknown>;
  for (const id of Object.keys(characters) as (keyof typeof characters)[]) {
    const c = incoming[id];
    if (c && typeof c === "object") {
      characters[id] = { ...characters[id], ...(c as (typeof characters)[typeof id]) };
    }
  }
  return {
    characters,
    activeSetback: r.activeSetback ?? null,
    setbackSeed: typeof r.setbackSeed === "number" ? r.setbackSeed : 1,
  };
}

function normalizeAnimals(raw: unknown): Record<string, AnimalPenRuntime> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, AnimalPenRuntime> = {};
  for (const [id, p] of Object.entries(raw as Record<string, unknown>)) {
    if (p && typeof p === "object") {
      out[id] = { startedAt: (p as AnimalPenRuntime).startedAt ?? null };
    }
  }
  return out;
}

function normalizeCity(
  raw: Partial<CityState> & { factories?: unknown; animals?: unknown },
): CityState {
  const base = createDefaultCityState();
  const level = raw.level ?? 1;
  // Keep any live orders, top the board back up to full with fresh ones.
  const seenSeeds = new Set<number>();

  const existingOrders = (raw.orders ?? []).filter((order) => {
    if (seenSeeds.has(order.seed)) return false;
    seenSeeds.add(order.seed);
    return true;
  });

  const maxSeed = Math.max(...existingOrders.map((order) => order.seed), 0);

  const missingOrders = Math.max(0, HELI_BOARD_SIZE - existingOrders.length);

  const orders = [
    ...existingOrders.slice(0, HELI_BOARD_SIZE),
    ...freshHeliBoard(level, maxSeed + 1).slice(0, missingOrders),
  ];
  return {
    ...base,
    ...raw,
    inventory: raw.inventory ?? {},
    materials: raw.materials ?? {},
    barnUpgrades: raw.barnUpgrades ?? 0,
    plots: raw.plots?.length ? raw.plots : base.plots,
    factories: normalizeFactories(raw.factories),
    animals: normalizeAnimals(raw.animals),
    orders,
    train: raw.train?.wagons?.length ? raw.train : freshTrain(level),
    plane: raw.plane?.manifest ? raw.plane : freshPlane(level),
    buildings: raw.buildings && typeof raw.buildings === "object" ? { ...raw.buildings } : {},
    townExpansions: raw.townExpansions ?? 0,
    tokens: raw.tokens ?? 0,
    stats: raw.stats && typeof raw.stats === "object" ? { ...raw.stats } : {},
    achievements: Array.isArray(raw.achievements) ? [...raw.achievements] : [],
    daily: raw.daily ?? base.daily,
    balloon: raw.balloon ?? base.balloon,
    mine: raw.mine ?? base.mine,
    zoo: Array.isArray(raw.zoo) ? [...raw.zoo] : [],
    harbor: raw.harbor?.manifest ? raw.harbor : freshHarbor(level),
    lives:
      raw.lives && typeof raw.lives.count === "number" && typeof raw.lives.since === "number"
        ? raw.lives
        : base.lives,
    boosterCharges: raw.boosterCharges ?? 0,
    story: normalizeStory(raw.story, base.story),
    level,
    xp: raw.xp ?? 0,
    barnCapacity: raw.barnCapacity ?? base.barnCapacity,
  };
}

function v1ToCurrent(v1: CityStateV1): CityState {
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
    factories: v1.factory?.batch
      ? { bakery: { queue: ["bread"], startedAt: v1.factory.batch.startedAt } }
      : {},
    lastPlayedLevelId: v1.lastPlayedLevelId ?? null,
  };
}

export function migrateCityState(raw: unknown): CityState {
  if (isEnvelope(raw)) return migrateCityState(raw.state);
  if (isModernCityState(raw)) return normalizeCity(raw);
  if (isV1CityState(raw)) return v1ToCurrent(raw);
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
