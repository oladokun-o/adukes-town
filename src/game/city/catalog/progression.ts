// Phase 6 meta-progression tunables: the earned-only premium currency
// ("tokens" — never purchasable, it's a gift), timer rush pricing, the
// daily bonus, and the gift balloon. Balance pass is Phase 9.

// --- Premium currency: tokens ----------------------------------------
// Tokens are only ever *earned* — achievements, the daily bonus, gift
// balloons, and gem finds in the mine. There is no store. The single sink
// is rushing timers (below).

// Rushing a timer costs 1 token per RUSH_MS_PER_TOKEN of remaining time,
// minimum 1. A finished timer is free (0) — nothing to rush.
export const RUSH_MS_PER_TOKEN = 5 * 60_000;

export function tokensToRush(remainingMs: number): number {
  if (remainingMs <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMs / RUSH_MS_PER_TOKEN));
}

// --- Daily bonus ----------------------------------------------------
// One claim per UTC calendar day. Miss more than a day and the streak
// resets. Reward escalates with the streak, capped.
export const DAILY_STREAK_CAP = 7;
export const DAILY_BASE_COINS = 40;
export const DAILY_COINS_PER_STREAK = 25;
// Every Nth streak day also pays a token.
export const DAILY_TOKEN_EVERY = 3;
// Each claim also tops up mine picks.
export const DAILY_PICKS = 2;

export function dayNumber(now: number): number {
  return Math.floor(now / 86_400_000);
}

export function dailyReward(streak: number): { coins: number; tokens: number; picks: number } {
  const capped = Math.min(streak, DAILY_STREAK_CAP);
  return {
    coins: DAILY_BASE_COINS + (capped - 1) * DAILY_COINS_PER_STREAK,
    tokens: capped % DAILY_TOKEN_EVERY === 0 ? 1 : 0,
    picks: DAILY_PICKS,
  };
}

// --- Gift balloon --------------------------------------------------
// A balloon drifts in every BALLOON_INTERVAL_MS; tap it for a small
// seeded reward, then the next one is scheduled. Purely client-side —
// the "availableAt" timestamp is all that's stored (iOS: no background).
export const BALLOON_INTERVAL_MS = 25 * 60_000;

export interface BalloonReward {
  kind: "coins" | "token" | "pick" | "seed";
  amount: number;
  // only set when kind === "seed"
  itemId?: string;
}

// Deterministic from the balloon's seed so a reload can't reroll it.
export function balloonReward(seed: number): BalloonReward {
  // xorshift-ish spread without pulling in mulberry32 here
  const r = ((seed ^ (seed >>> 13)) >>> 0) % 100;
  if (r < 55) return { kind: "coins", amount: 20 + (r % 5) * 10 };
  if (r < 80) return { kind: "pick", amount: 1 };
  if (r < 92) return { kind: "seed", amount: 3, itemId: "seed_wheat" };
  return { kind: "token", amount: 1 };
}

// --- Match-3 tie-in -----------------------------------------------
// A match-3 win drops one mine pick into the city (deepened further in
// Phase 7).
export const MATCH_WIN_PICKS = 1;
