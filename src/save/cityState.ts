import { idbGet, idbSet } from "@/save/db";
import { createDefaultCityState, CITY_SCHEMA_VERSION, type CityState } from "@/game/city/types";
import { migrateCityState } from "@/save/migrate";

const IDB_KEY = "city:state";

// Read-through cache, same reasoning as levels/progress.ts and
// settings/relaxMode.ts: Svelte reads this synchronously on mount, but
// IndexedDB is inherently async. Hydrated once at app bootstrap (see
// loadCityStateFromDb) and written through on every change.
let cache: CityState = createDefaultCityState();

// cityState.ts is the single source of truth — both the Svelte store
// (cityStore.ts, for user-initiated actions) and matchTie.ts (for match-3
// results, which never touches Svelte directly) write through storeCityState.
// Listeners let the Svelte store stay in sync no matter which of those two
// callers made the change.
type Listener = (state: CityState) => void;
const listeners = new Set<Listener>();

// Persisted with a version envelope so future schema bumps have a marker to
// branch on. migrate.ts transparently reads both the envelope and the old
// bare-object form.
interface CityEnvelope {
  schemaVersion: number;
  state: CityState;
}

export function onCityStateChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCityState(): CityState {
  return cache;
}

export async function storeCityState(next: CityState): Promise<void> {
  cache = next;
  for (const listener of listeners) listener(next);
  const envelope: CityEnvelope = { schemaVersion: CITY_SCHEMA_VERSION, state: next };
  await idbSet(IDB_KEY, envelope);
}

// Call once at app bootstrap. Since ES module graphs evaluate all static
// imports before the importing module's own top-level code runs, the Svelte
// store (cityStore.ts) is already constructed — from the pre-hydration
// default state — by the time this resolves, via main.ts's dependency
// chain (main.ts -> mountCityApp.ts -> CityApp.svelte -> cityStore.ts).
// Notifying listeners here, not just updating the cache, is what lets that
// already-created store pick up the hydrated value.
export async function loadCityStateFromDb(): Promise<void> {
  const stored = await idbGet<unknown>(IDB_KEY);
  if (stored === undefined) return;
  const migrated = migrateCityState(stored);
  cache = migrated;
  for (const listener of listeners) listener(migrated);
}
