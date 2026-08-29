// Achievements (Phase 6). Each tracks one running counter in
// CityState.stats and pays out coins + tokens once claimed. Tiered — the
// same stat appears at rising thresholds. Balance pass is Phase 9.

export type StatKey =
  | "cropsHarvested"
  | "goodsProduced"
  | "ordersFilled"
  | "animalsCollected"
  | "buildingsBuilt"
  | "rocksMined"
  | "habitatsBuilt"
  | "tripsCompleted"
  | "match3Wins";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  stat: StatKey;
  threshold: number;
  rewardCoins: number;
  rewardTokens: number;
}

function tiers(
  base: string,
  name: string,
  stat: StatKey,
  steps: number[],
  coinsPerStep: number,
): AchievementDef[] {
  return steps.map((threshold, i) => ({
    id: `${base}_${i + 1}`,
    name: `${name} ${["I", "II", "III", "IV", "V"][i] ?? i + 1}`,
    description: `Reach ${threshold} ${name.toLowerCase()}`,
    stat,
    threshold,
    rewardCoins: coinsPerStep * (i + 1),
    rewardTokens: i === 0 ? 0 : 1,
  }));
}

const ACHIEVEMENT_LIST: AchievementDef[] = [
  ...tiers("green_thumb", "Harvests", "cropsHarvested", [25, 150, 600], 30),
  ...tiers("industrialist", "Goods produced", "goodsProduced", [20, 120, 500], 40),
  ...tiers("supplier", "Orders filled", "ordersFilled", [10, 60, 250], 50),
  ...tiers("rancher", "Animal collections", "animalsCollected", [10, 50, 200], 45),
  ...tiers("architect", "Buildings built", "buildingsBuilt", [3, 12, 30], 80),
  ...tiers("prospector", "Rocks mined", "rocksMined", [15, 75, 300], 35),
  ...tiers("zookeeper", "Habitats built", "habitatsBuilt", [1, 3, 5], 200),
  ...tiers("navigator", "Trips completed", "tripsCompleted", [5, 25, 100], 60),
  ...tiers("puzzler", "Match-3 wins", "match3Wins", [5, 25, 100], 40),
];

export const ACHIEVEMENTS: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_LIST.map((a) => [a.id, a]),
);

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS[id];
}

export function allAchievements(): AchievementDef[] {
  return ACHIEVEMENT_LIST;
}
