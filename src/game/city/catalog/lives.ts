// Match-3 lives (Phase 7). Deliberately generous — the whole reason this
// project exists is to fix Township's punishing life gate:
//   - a WIN costs nothing
//   - only a LOSS costs one life, and it still grants partial rewards
//     (no pure-loss state — see matchRewards.ts)
//   - relax mode ignores lives entirely, toggle without friction
//   - lives are NEVER buyable with coins or tokens (that would make this a
//     monetized gate again); they only regenerate, or arrive as gifts
// Regen is derived from a stored timestamp on load — no background timers,
// iOS-safe.

export const MAX_LIVES = 10;
export const LIFE_REGEN_MS = 4 * 60_000;
// Starting lives on a fresh save.
export const STARTING_LIVES = MAX_LIVES;
