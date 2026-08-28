import { getRecipe } from "@/game/city/catalog";
import type { FactoryRuntime } from "@/game/city/types";

// Pure queries over a factory's production queue. queue[0] is cooking since
// `startedAt`; each subsequent slot starts when the one before it finishes.
// "Done" slots stay at the front of the queue until collected.

export const QUEUE_CAPACITY = 4;

export function emptyFactory(): FactoryRuntime {
  return { queue: [], startedAt: null };
}

interface Settled {
  done: string[]; // recipe ids finished, front of queue, ready to collect
  remaining: string[]; // still cooking / waiting
  remainingStartedAt: number | null; // when remaining[0] (effectively) started
}

// Splits the queue into finished vs still-cooking given `now`.
export function settleFactory(f: FactoryRuntime, now: number): Settled {
  if (f.queue.length === 0 || f.startedAt === null) {
    return { done: [], remaining: [...f.queue], remainingStartedAt: f.startedAt };
  }
  const elapsed = now - f.startedAt;
  let cumulative = 0;
  let doneCount = 0;
  for (const recipeId of f.queue) {
    const recipe = getRecipe(recipeId);
    const ms = recipe?.produceMs ?? 0;
    if (elapsed >= cumulative + ms) {
      cumulative += ms;
      doneCount += 1;
    } else {
      break;
    }
  }
  const done = f.queue.slice(0, doneCount);
  const remaining = f.queue.slice(doneCount);
  return {
    done,
    remaining,
    remainingStartedAt: remaining.length > 0 ? f.startedAt + cumulative : null,
  };
}

export function readyCount(f: FactoryRuntime, now: number): number {
  return settleFactory(f, now).done.length;
}

export function pendingCount(f: FactoryRuntime, now: number): number {
  return settleFactory(f, now).remaining.length;
}

export function queueLength(f: FactoryRuntime): number {
  return f.queue.length;
}

// Time left on the currently-cooking slot (the first not-yet-done one), or 0.
export function activeRemainingMs(f: FactoryRuntime, now: number): number {
  const { remaining, remainingStartedAt } = settleFactory(f, now);
  if (remaining.length === 0 || remainingStartedAt === null) return 0;
  const recipe = getRecipe(remaining[0]);
  if (!recipe) return 0;
  return Math.max(0, remainingStartedAt + recipe.produceMs - now);
}
