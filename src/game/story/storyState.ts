import { idbGet, idbSet } from "@/save/db";
import { createDefaultStoryState, type StoryState } from "@/game/story/types";

const IDB_KEY = "story:state";

// Read-through cache + idb persistence, identical shape to
// game/city/cityState.ts — see that file for the full reasoning (Svelte
// reads this synchronously, IndexedDB can't be; listeners let a store
// created before hydration still pick up the loaded value).
let cache: StoryState = createDefaultStoryState();

type Listener = (state: StoryState) => void;
const listeners = new Set<Listener>();

export function onStoryStateChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoryState(): StoryState {
  return cache;
}

export async function storeStoryState(next: StoryState): Promise<void> {
  cache = next;
  for (const listener of listeners) listener(next);
  await idbSet(IDB_KEY, next);
}

// Call once at app bootstrap.
export async function loadStoryStateFromDb(): Promise<void> {
  const stored = await idbGet<StoryState>(IDB_KEY);
  if (stored) {
    cache = stored;
    for (const listener of listeners) listener(stored);
  }
}
