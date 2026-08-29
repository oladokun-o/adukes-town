// The narrative layer ("Remember" mechanic — story bible §5). NPCs share
// small facts about themselves through dialogue; the player is rewarded for
// *recalling and acting on* them later, which raises a relationship level
// ("hearts"), unlocks more dialogue, and feeds the town's reputation.
//
// Fictionalized per the story bible: real people are the inspiration, the
// cast is fictional. Aduke is the player, not an NPC.

export type CharacterId = "dapo" | "simi" | "kemi" | "tunde" | "seun";

export const CHARACTER_IDS: CharacterId[] = ["dapo", "simi", "kemi", "tunde", "seun"];

export interface MemoryFact {
  id: string;
  // Shown in the "things you know" journal once discovered.
  text: string;
  // The payoff line shown when the player acts on the fact via Remember.
  responseLine: string;
}

export interface CharacterRelationship {
  // How many times the player has talked to them (drives the fixed script).
  visits: number;
  discoveredFactIds: string[];
  actedOnFactIds: string[];
  // Relationship level, 0..MAX_HEARTS. Rises when a fact is acted on and
  // when a festival for this character is celebrated.
  hearts: number;
  celebratedFestivalIds: string[];
}

// A town setback (story bible §4: "Things don't always go to plan, but she
// keeps going"). While active it dents town reputation; repairing it costs
// resources and grants a resilience bonus.
export interface Setback {
  id: string;
  label: string;
  repairCoins: number;
  repairMaterials: Record<string, number>;
}

export interface StoryState {
  characters: Record<CharacterId, CharacterRelationship>;
  activeSetback: Setback | null;
  // Monotonic seed for the next generated setback (deterministic content).
  setbackSeed: number;
}

export const MAX_HEARTS = 5;

// Acting on a fact pays coins + XP + a heart; a filled heart bar also nudges
// town reputation (see narrativeReputation).
export const REMEMBER_REWARD_COINS = 30;
export const REMEMBER_REWARD_XP = 6;
export const REPUTATION_PER_HEART = 2;

function freshRelationship(): CharacterRelationship {
  return {
    visits: 0,
    discoveredFactIds: [],
    actedOnFactIds: [],
    hearts: 0,
    celebratedFestivalIds: [],
  };
}

export function createDefaultStoryState(): StoryState {
  return {
    characters: {
      dapo: freshRelationship(),
      simi: freshRelationship(),
      kemi: freshRelationship(),
      tunde: freshRelationship(),
      seun: freshRelationship(),
    },
    activeSetback: null,
    setbackSeed: 1,
  };
}

// Reputation the narrative layer contributes: REPUTATION_PER_HEART per
// earned heart across the whole cast, minus a flat penalty while a setback
// is unrepaired.
export function narrativeReputation(story: StoryState): number {
  let hearts = 0;
  for (const id of CHARACTER_IDS) hearts += story.characters[id].hearts;
  const setbackPenalty = story.activeSetback ? 8 : 0;
  return hearts * REPUTATION_PER_HEART - setbackPenalty;
}
