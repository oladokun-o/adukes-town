// The zoo (Phase 6). A one-off collection track: each habitat is built once
// by handing over a bundle of goods, and pays a lump of coins + tokens and
// a permanent town-reputation boost. No timers — it's a goal to work
// toward, Township-style.

export const ZOO_UNLOCK_LEVEL = 10;

export interface HabitatDef {
  id: string;
  name: string;
  emoji: string;
  // item id → qty consumed from the barn to build it
  goods: Record<string, number>;
  rewardCoins: number;
  rewardTokens: number;
  reputation: number;
}

const HABITAT_LIST: HabitatDef[] = [
  {
    id: "aviary",
    name: "Aviary",
    emoji: "🦜",
    goods: { good_bread: 6, crop_corn: 10 },
    rewardCoins: 400,
    rewardTokens: 1,
    reputation: 8,
  },
  {
    id: "pond",
    name: "Otter Pond",
    emoji: "🦦",
    goods: { good_juice: 4, crop_carrot: 12 },
    rewardCoins: 700,
    rewardTokens: 1,
    reputation: 12,
  },
  {
    id: "savanna",
    name: "Savanna",
    emoji: "🦒",
    goods: { good_feed: 20, good_cheese: 4 },
    rewardCoins: 1200,
    rewardTokens: 2,
    reputation: 18,
  },
  {
    id: "reptile_house",
    name: "Reptile House",
    emoji: "🦎",
    goods: { good_veggie_soup: 3, good_tomato_sauce: 5 },
    rewardCoins: 1800,
    rewardTokens: 2,
    reputation: 24,
  },
  {
    id: "primate_forest",
    name: "Primate Forest",
    emoji: "🦧",
    goods: { good_jam: 4, good_cake: 3, crop_pumpkin: 6 },
    rewardCoins: 2600,
    rewardTokens: 3,
    reputation: 32,
  },
];

export const HABITATS: Record<string, HabitatDef> = Object.fromEntries(
  HABITAT_LIST.map((h) => [h.id, h]),
);

export function getHabitat(id: string): HabitatDef | undefined {
  return HABITATS[id];
}

export function allHabitats(): HabitatDef[] {
  return HABITAT_LIST;
}
