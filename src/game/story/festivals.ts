import type { CharacterId } from "@/game/story/types";

// Festivals (story bible §4: "She remembers people's special moments").
// Date-triggered: a festival is celebratable when today is within
// FESTIVAL_WINDOW_DAYS of its month/day. Celebrating costs a small gift
// bundle and pays coins + relationship hearts + a reputation bump.
// Fictional dates — not real birthdays.

export const FESTIVAL_WINDOW_DAYS = 3;

export interface FestivalDef {
  id: string;
  name: string;
  emoji: string;
  // Whose day it is. `null` = a town-wide festival (spreads hearts thin
  // across the whole cast).
  characterId: CharacterId | null;
  month: number; // 1-12
  day: number;
  gift: Record<string, number>; // itemId -> qty consumed from the barn
  rewardCoins: number;
  rewardHearts: number;
}

const FESTIVALS: FestivalDef[] = [
  {
    id: "dapo-birthday",
    name: "Dapo's Birthday",
    emoji: "🎂",
    characterId: "dapo",
    month: 3,
    day: 14,
    gift: { good_cake: 2, good_juice: 2 },
    rewardCoins: 300,
    rewardHearts: 2,
  },
  {
    id: "simi-birthday",
    name: "Simi's Birthday",
    emoji: "🎉",
    characterId: "simi",
    month: 6,
    day: 2,
    gift: { good_bread: 4, good_jam: 1 },
    rewardCoins: 260,
    rewardHearts: 2,
  },
  {
    id: "kemi-birthday",
    name: "Kemi's Birthday",
    emoji: "💐",
    characterId: "kemi",
    month: 9,
    day: 20,
    gift: { good_cheese: 2, good_juice: 3 },
    rewardCoins: 260,
    rewardHearts: 2,
  },
  {
    id: "tunde-birthday",
    name: "Tunde's Birthday",
    emoji: "🥳",
    characterId: "tunde",
    month: 1,
    day: 8,
    gift: { good_bread: 3, good_feed: 6 },
    rewardCoins: 240,
    rewardHearts: 2,
  },
  {
    id: "seun-birthday",
    name: "Seun's Birthday",
    emoji: "🎈",
    characterId: "seun",
    month: 11,
    day: 30,
    gift: { good_cookies: 4, good_juice: 2 },
    rewardCoins: 240,
    rewardHearts: 2,
  },
  {
    id: "beach-day",
    name: "Beach Day",
    emoji: "🏖️",
    characterId: null,
    month: 7,
    day: 15,
    gift: { good_juice: 4, good_cookies: 4 },
    rewardCoins: 400,
    rewardHearts: 1,
  },
  {
    id: "movie-night",
    name: "Town Movie Night",
    emoji: "🎬",
    characterId: null,
    month: 12,
    day: 20,
    gift: { good_cookies: 6, good_cake: 2 },
    rewardCoins: 400,
    rewardHearts: 1,
  },
];

export function allFestivals(): FestivalDef[] {
  return FESTIVALS;
}

export function getFestival(id: string): FestivalDef | undefined {
  return FESTIVALS.find((f) => f.id === id);
}

// Days between two month/day pairs, ignoring year — the minimum forward or
// backward distance around a 365-day ring.
function dayOfYear(month: number, day: number): number {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cum[month - 1] + day;
}

export function festivalActiveOn(festival: FestivalDef, now: number): boolean {
  const d = new Date(now);
  const today = dayOfYear(d.getMonth() + 1, d.getDate());
  const target = dayOfYear(festival.month, festival.day);
  const diff = Math.abs(today - target);
  return Math.min(diff, 365 - diff) <= FESTIVAL_WINDOW_DAYS;
}

export function activeFestivals(now: number): FestivalDef[] {
  return FESTIVALS.filter((f) => festivalActiveOn(f, now));
}
