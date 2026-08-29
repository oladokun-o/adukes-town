import { hasItems, removeItems } from "@/game/city/barn";
import { mulberry32 } from "@/game/city/catalog";
import { hasMaterials, payMaterials } from "@/game/city/cityActions";
import type { CityState } from "@/game/city/types";
import { applyXpGain } from "@/game/city/xp";
import { getFestival, festivalActiveOn } from "@/game/story/festivals";
import { getLineForVisit } from "@/game/story/scripts";
import {
  CHARACTER_IDS,
  MAX_HEARTS,
  REMEMBER_REWARD_COINS,
  REMEMBER_REWARD_XP,
  type CharacterId,
  type CharacterRelationship,
  type Setback,
  type StoryState,
} from "@/game/story/types";

// Guarded, pure transitions over CityState.story — same contract as
// cityActions.ts (an invalid call returns the same state ref). Story sits
// inside CityState so it rides the one versioned save + cloud sync.

function withStory(state: CityState, update: (story: StoryState) => StoryState): CityState {
  return { ...state, story: update(state.story) };
}

function withCharacter(
  story: StoryState,
  id: CharacterId,
  update: (c: CharacterRelationship) => CharacterRelationship,
): StoryState {
  return { ...story, characters: { ...story.characters, [id]: update(story.characters[id]) } };
}

// Talk: advance the visit count and reveal the fact due this visit, if any.
export function talkTo(state: CityState, id: CharacterId): CityState {
  const nextVisits = state.story.characters[id].visits + 1;
  const line = getLineForVisit(id, nextVisits);
  return withStory(state, (story) =>
    withCharacter(story, id, (c) => ({
      ...c,
      visits: nextVisits,
      discoveredFactIds:
        line?.fact && !c.discoveredFactIds.includes(line.fact.id)
          ? [...c.discoveredFactIds, line.fact.id]
          : c.discoveredFactIds,
    })),
  );
}

// Remember: act on a discovered fact once. Pays coins + XP + a heart.
export function rememberFact(state: CityState, id: CharacterId, factId: string): CityState {
  const c = state.story.characters[id];
  if (!c.discoveredFactIds.includes(factId) || c.actedOnFactIds.includes(factId)) return state;
  const stored = withStory({ ...state, coins: state.coins + REMEMBER_REWARD_COINS }, (story) =>
    withCharacter(story, id, (ch) => ({
      ...ch,
      actedOnFactIds: [...ch.actedOnFactIds, factId],
      hearts: Math.min(MAX_HEARTS, ch.hearts + 1),
    })),
  );
  return applyXpGain(stored, REMEMBER_REWARD_XP);
}

// Celebrate a festival that's in season and not yet celebrated. Consumes
// the gift bundle from the barn; pays coins + hearts (to the honoree, or
// spread across the whole cast for a town-wide festival).
export function celebrateFestival(state: CityState, festivalId: string, now: number): CityState {
  const def = getFestival(festivalId);
  if (!def || !festivalActiveOn(def, now)) return state;
  const targets = def.characterId ? [def.characterId] : CHARACTER_IDS;
  // "Celebrated" is tracked per honoree (or on every character for a
  // town-wide one) so it can't be repeated.
  if (targets.every((t) => state.story.characters[t].celebratedFestivalIds.includes(festivalId))) {
    return state;
  }
  if (!hasItems(state.inventory, def.gift)) return state;

  let inventory = state.inventory;
  for (const [gid, qty] of Object.entries(def.gift)) inventory = removeItems(inventory, gid, qty);

  let story = state.story;
  for (const t of targets) {
    story = withCharacter(story, t, (c) => ({
      ...c,
      hearts: Math.min(MAX_HEARTS, c.hearts + def.rewardHearts),
      celebratedFestivalIds: c.celebratedFestivalIds.includes(festivalId)
        ? c.celebratedFestivalIds
        : [...c.celebratedFestivalIds, festivalId],
    }));
  }
  return { ...state, inventory, coins: state.coins + def.rewardCoins, story };
}

// --- Setbacks --------------------------------------------------------

const SETBACK_TEMPLATES: Omit<Setback, "id">[] = [
  {
    label: "A storm knocked down fences overnight",
    repairCoins: 150,
    repairMaterials: { mat_plank: 4, mat_nail: 6 },
  },
  {
    label: "Blight crept through part of the fields",
    repairCoins: 200,
    repairMaterials: { mat_plank: 2, mat_bolt: 2 },
  },
  {
    label: "The market roof is leaking again",
    repairCoins: 250,
    repairMaterials: { mat_plank: 5, mat_nail: 8 },
  },
  {
    label: "Flooding left the low road impassable",
    repairCoins: 300,
    repairMaterials: { mat_brick: 3, mat_plank: 3 },
  },
];

export function generateSetback(seed: number): Setback {
  const t = SETBACK_TEMPLATES[Math.floor(mulberry32(seed)() * SETBACK_TEMPLATES.length)];
  return { id: `setback-${seed}`, ...t };
}

// Roll for a new setback — only when none is active and the town is
// established enough to have something to lose. Called from the daily
// bonus so it's a bounded, once-a-day check (no background timers).
export function maybeTriggerSetback(state: CityState, minLevel = 5): CityState {
  if (state.story.activeSetback || state.level < minLevel) return state;
  const seed = state.story.setbackSeed;
  if (mulberry32(seed ^ 0x51ed)() >= 0.35) {
    // No setback this time — still advance the seed so the next roll differs.
    return withStory(state, (story) => ({ ...story, setbackSeed: seed + 1 }));
  }
  return withStory(state, (story) => ({
    ...story,
    activeSetback: generateSetback(seed),
    setbackSeed: seed + 1,
  }));
}

// Repair the active setback: costs coins + materials, clears it, and pays a
// resilience XP bonus (story bible §4: rebuilding after setbacks).
export function repairSetback(state: CityState): CityState {
  const setback = state.story.activeSetback;
  if (!setback) return state;
  if (state.coins < setback.repairCoins || !hasMaterials(state, setback.repairMaterials)) {
    return state;
  }
  const stored: CityState = {
    ...state,
    coins: state.coins - setback.repairCoins,
    materials: payMaterials(state.materials, setback.repairMaterials),
    story: { ...state.story, activeSetback: null },
  };
  return applyXpGain(stored, 30);
}

// Small helper the balloon/daily reward path can call to hand out a stray
// heart as a gift.
export function grantHeart(state: CityState, id: CharacterId): CityState {
  return withStory(state, (story) =>
    withCharacter(story, id, (c) => ({ ...c, hearts: Math.min(MAX_HEARTS, c.hearts + 1) })),
  );
}
