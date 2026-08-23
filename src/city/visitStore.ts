import { writable } from "svelte/store";
import { depositCoins } from "@/game/city/cityActions";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { rememberFact, visitCharacter } from "@/game/story/storyActions";
import { getStoryState, onStoryStateChange, storeStoryState } from "@/game/story/storyState";
import { REMEMBER_REWARD_COINS, type CharacterId, type StoryState } from "@/game/story/types";

export const storyState = writable<StoryState>(getStoryState());
onStoryStateChange((next) => storyState.set(next));

function persistStory(next: StoryState): void {
  storeStoryState(next).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save story state.", err);
  });
}

export function visit(id: CharacterId): void {
  const state = getStoryState();
  const next = visitCharacter(state, id);
  if (next === state) return;
  persistStory(next);
}

// Reuses the existing city coin system as the Remember payoff, rather than
// a new relationship/warmth stat for this pilot — same reasoning
// game/city/matchTie.ts already applies to coupling match-3 results to city
// coins: one small module crosses the domain boundary, everything else
// stays single-purpose.
export function remember(id: CharacterId, factId: string): void {
  const state = getStoryState();
  const next = rememberFact(state, id, factId);
  if (next === state) return;

  persistStory(next);

  const cityNext = depositCoins(getCityState(), REMEMBER_REWARD_COINS);
  storeCityState(cityNext).catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't save city state.", err);
  });
}
