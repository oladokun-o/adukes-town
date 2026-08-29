import { LIFE_REGEN_MS, MAX_LIVES } from "@/game/city/catalog";
import type { CityState, LivesState } from "@/game/city/types";

// Pure lives math. `stored` is the count at `since`; anything regenerated
// since then is computed from the timestamp (no background timers). Once at
// MAX_LIVES the clock is meaningless — `since` is only advanced while below
// the cap.

export function currentLives(state: CityState, now: number): number {
  const { count, since } = state.lives;
  if (count >= MAX_LIVES) return MAX_LIVES;
  const regenerated = Math.floor(Math.max(0, now - since) / LIFE_REGEN_MS);
  return Math.min(MAX_LIVES, count + regenerated);
}

// Milliseconds until the next life regenerates, or 0 when already full.
export function msToNextLife(state: CityState, now: number): number {
  if (currentLives(state, now) >= MAX_LIVES) return 0;
  const elapsedSinceLast = Math.max(0, now - state.lives.since) % LIFE_REGEN_MS;
  return LIFE_REGEN_MS - elapsedSinceLast;
}

// Normalise the stored form to "count as of now" so arithmetic on it is
// simple. Advances `since` to `now` only when below the cap (so partial
// regen progress isn't lost); pins it to `now` at the cap.
function settle(state: CityState, now: number): LivesState {
  const count = currentLives(state, now);
  if (count >= MAX_LIVES) return { count: MAX_LIVES, since: now };
  // Keep the sub-LIFE_REGEN_MS remainder rolling toward the next life.
  const remainder = Math.max(0, now - state.lives.since) % LIFE_REGEN_MS;
  return { count, since: now - remainder };
}

export function spendLife(state: CityState, now: number): CityState {
  const settled = settle(state, now);
  if (settled.count <= 0) return state;
  // Keep any partial regen progress — spending a life shouldn't also throw
  // away time already waited toward the next one.
  return { ...state, lives: { count: settled.count - 1, since: settled.since } };
}

export function addLives(state: CityState, amount: number, now: number): CityState {
  if (amount <= 0) return state;
  const settled = settle(state, now);
  return {
    ...state,
    lives: {
      count: Math.min(MAX_LIVES, settled.count + amount),
      since: settled.since,
    },
  };
}
