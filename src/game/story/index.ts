// Public entry for the narrative layer + pure derived views over
// CityState.story.

export * from "@/game/story/types";
export * from "@/game/story/scripts";
export * from "@/game/story/festivals";
export * from "@/game/story/storyActions";

import { hasItems } from "@/game/city/barn";
import type { CityState } from "@/game/city/types";
import { activeFestivals, type FestivalDef } from "@/game/story/festivals";
import { getAllFacts, getLineForVisit, type DialogueLine } from "@/game/story/scripts";
import { CHARACTER_IDS, type CharacterId, type MemoryFact } from "@/game/story/types";

export function currentLine(state: CityState, id: CharacterId): DialogueLine | null {
  return getLineForVisit(id, state.story.characters[id].visits);
}

export function discoveredFacts(state: CityState, id: CharacterId): MemoryFact[] {
  const known = new Set(state.story.characters[id].discoveredFactIds);
  return getAllFacts(id).filter((f) => known.has(f.id));
}

// Facts known but not yet acted on — what the Remember list shows.
export function rememberableFacts(state: CityState, id: CharacterId): MemoryFact[] {
  const c = state.story.characters[id];
  const acted = new Set(c.actedOnFactIds);
  return discoveredFacts(state, id).filter((f) => !acted.has(f.id));
}

export function totalHearts(state: CityState): number {
  let n = 0;
  for (const id of CHARACTER_IDS) n += state.story.characters[id].hearts;
  return n;
}

// How many Remember prompts are waiting across the whole cast (drives the
// HUD nudge).
export function pendingRemembers(state: CityState): number {
  let n = 0;
  for (const id of CHARACTER_IDS) n += rememberableFacts(state, id).length;
  return n;
}

export interface CelebratableFestival {
  festival: FestivalDef;
  affordable: boolean;
  celebrated: boolean;
}

// Festivals in season right now, with whether the player can afford the
// gift and whether it's already been celebrated.
export function celebratableFestivals(state: CityState, now: number): CelebratableFestival[] {
  return activeFestivals(now).map((festival) => {
    const targets = festival.characterId ? [festival.characterId] : CHARACTER_IDS;
    const celebrated = targets.every((t) =>
      state.story.characters[t].celebratedFestivalIds.includes(festival.id),
    );
    return { festival, affordable: hasItems(state.inventory, festival.gift), celebrated };
  });
}
