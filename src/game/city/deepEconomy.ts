import {
  allAchievements,
  allHabitats,
  dayNumber,
  getAchievement,
  getHabitat,
  type AchievementDef,
  type HabitatDef,
} from "@/game/city/catalog";
import type { CityState } from "@/game/city/types";

// Pure derived views over the Phase 6 layer (tokens / stats / achievements /
// daily / balloon / mine / zoo). Nothing here mutates — the guarded actions
// live in cityActions.ts.

export function statValue(state: CityState, key: string): number {
  return state.stats[key] ?? 0;
}

export function achievementReached(state: CityState, id: string): boolean {
  const def = getAchievement(id);
  return def !== undefined && statValue(state, def.stat) >= def.threshold;
}

export function achievementClaimed(state: CityState, id: string): boolean {
  return state.achievements.includes(id);
}

// Reached but not yet claimed — what the UI shows a "Claim" button for.
export function claimableAchievements(state: CityState): AchievementDef[] {
  return allAchievements().filter(
    (a) => achievementReached(state, a.id) && !achievementClaimed(state, a.id),
  );
}

export function achievementProgress(
  state: CityState,
  id: string,
): { current: number; threshold: number } {
  const def = getAchievement(id);
  if (!def) return { current: 0, threshold: 0 };
  return { current: statValue(state, def.stat), threshold: def.threshold };
}

export function dailyAvailable(state: CityState, now: number): boolean {
  return state.daily.lastClaimedDay !== dayNumber(now);
}

export function balloonReady(state: CityState, now: number): boolean {
  return now >= state.balloon.availableAt;
}

export function habitatBuilt(state: CityState, id: string): boolean {
  return state.zoo.includes(id);
}

// The next habitat still to build (list order), or undefined when the zoo
// is complete.
export function nextHabitat(state: CityState): HabitatDef | undefined {
  return allHabitats().find((h) => !habitatBuilt(state, h.id));
}

// Reputation contributed by built zoo habitats (folded into town rep by
// town.ts).
export function zooReputation(state: CityState): number {
  let rep = 0;
  for (const id of state.zoo) rep += getHabitat(id)?.reputation ?? 0;
  return rep;
}
