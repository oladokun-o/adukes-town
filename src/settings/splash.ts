import { idbGet, idbSet } from "@/save/db";

// Controls the intro sequence: the Nxtedge Studio sting, then — during her
// birthday season, or the very first time the app is ever opened — a short
// personal birthday card, then the title.
//
// Read-through cache + bootstrap hydration, same shape as the other
// settings modules (relaxMode.ts, installBanner.ts).

const IDB_KEY = "splash:state";

interface SplashState {
  // Set once the birthday card has been shown at least once, so a launch
  // outside the birthday window doesn't replay it forever.
  birthdayShown: boolean;
}

let cache: SplashState = { birthdayShown: false };

// Her birthday. The card recurs every year within a few days of it.
const BIRTHDAY_MONTH = 8; // August (1-indexed)
const BIRTHDAY_DAY = 30;
const WINDOW_DAYS = 4;

function dayOfYear(month: number, day: number): number {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cum[month - 1] + day;
}

export function isBirthdaySeason(now: number): boolean {
  const d = new Date(now);
  const today = dayOfYear(d.getMonth() + 1, d.getDate());
  const target = dayOfYear(BIRTHDAY_MONTH, BIRTHDAY_DAY);
  const diff = Math.abs(today - target);
  return Math.min(diff, 365 - diff) <= WINDOW_DAYS;
}

// Show the birthday card if it's her birthday season, or if it has never
// been shown at all (so the gift always lands the first time).
export function shouldShowBirthdayCard(now: number): boolean {
  return !cache.birthdayShown || isBirthdaySeason(now);
}

export async function markBirthdayCardShown(): Promise<void> {
  if (cache.birthdayShown) return;
  cache = { birthdayShown: true };
  await idbSet(IDB_KEY, cache);
}

export async function loadSplashStateFromDb(): Promise<void> {
  const stored = await idbGet<SplashState>(IDB_KEY);
  if (stored && typeof stored.birthdayShown === "boolean") cache = stored;
}
