// Only one character exists for this pilot — a union type (not a bare
// string) so adding a second character later is a type-checked change
// everywhere CharacterId is used, not a silent runtime string mismatch.
export type CharacterId = "dapo";

export interface MemoryFact {
  id: string;
  // Shown once discovered, e.g. in a "things you know" list.
  text: string;
  // Shown when the player acts on this fact via the Remember action — the
  // actual payoff line, distinct from the discovery text.
  responseLine: string;
}

export interface CharacterState {
  visits: number;
  discoveredFactIds: string[];
  actedOnFactIds: string[];
}

export interface StoryState {
  characters: Record<CharacterId, CharacterState>;
}

// Reuses the existing city coin system as the Remember payoff rather than
// inventing a new relationship/warmth stat for this pilot.
export const REMEMBER_REWARD_COINS = 30;

export function createDefaultStoryState(): StoryState {
  return {
    characters: {
      dapo: { visits: 0, discoveredFactIds: [], actedOnFactIds: [] },
    },
  };
}
