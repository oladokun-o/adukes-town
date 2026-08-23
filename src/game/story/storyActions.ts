import { getLineForVisit } from "@/game/story/dapo";
import type { CharacterId, CharacterState, StoryState } from "@/game/story/types";

// Guarded, pure state transitions — same convention as game/city/cityActions.ts:
// an invalid call (remembering an undiscovered or already-acted-on fact) is a
// no-op, never a throw.

function withCharacter(
  state: StoryState,
  id: CharacterId,
  update: (character: CharacterState) => CharacterState,
): StoryState {
  return {
    ...state,
    characters: { ...state.characters, [id]: update(state.characters[id]) },
  };
}

// Advances the visit count and reveals the next fact due, if any. Coin
// rewards live entirely in rememberFact — visiting itself is free to repeat.
export function visitCharacter(state: StoryState, id: CharacterId): StoryState {
  const nextVisits = state.characters[id].visits + 1;
  const line = getLineForVisit(id, nextVisits);

  return withCharacter(state, id, (character) => ({
    ...character,
    visits: nextVisits,
    discoveredFactIds:
      line?.fact && !character.discoveredFactIds.includes(line.fact.id)
        ? [...character.discoveredFactIds, line.fact.id]
        : character.discoveredFactIds,
  }));
}

export function rememberFact(state: StoryState, id: CharacterId, factId: string): StoryState {
  const character = state.characters[id];
  if (!character.discoveredFactIds.includes(factId) || character.actedOnFactIds.includes(factId)) {
    return state;
  }

  return withCharacter(state, id, (c) => ({
    ...c,
    actedOnFactIds: [...c.actedOnFactIds, factId],
  }));
}
