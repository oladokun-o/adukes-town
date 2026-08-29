// Match-3 boosters (Phase 7). Bought with booster charges — a soft currency
// that only ever comes FROM playing match-3 (win payouts) and achievement
// claims, never from coins/tokens/IAP. Chosen on the pre-game screen and
// applied at board init, so none of them touch the cascade/render loop.

export type BoosterEffect =
  | { kind: "extraMoves"; amount: number }
  | { kind: "headStart"; amount: number }
  | { kind: "startRainbow"; amount: number };

export interface BoosterDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number; // booster charges
  effect: BoosterEffect;
}

const BOOSTER_LIST: BoosterDef[] = [
  {
    id: "extra_moves",
    name: "+5 Moves",
    emoji: "➕",
    description: "Start the level with 5 extra moves.",
    cost: 2,
    effect: { kind: "extraMoves", amount: 5 },
  },
  {
    id: "head_start",
    name: "Head Start",
    emoji: "🎯",
    description: "Begin with 3 of every goal already collected.",
    cost: 3,
    effect: { kind: "headStart", amount: 3 },
  },
  {
    id: "rainbow_start",
    name: "Rainbow Start",
    emoji: "🌈",
    description: "Drop a Rainbow Ball onto the board to begin.",
    cost: 4,
    effect: { kind: "startRainbow", amount: 1 },
  },
];

export const BOOSTERS: Record<string, BoosterDef> = Object.fromEntries(
  BOOSTER_LIST.map((b) => [b.id, b]),
);

export function getBooster(id: string): BoosterDef | undefined {
  return BOOSTERS[id];
}

export function allBoosters(): BoosterDef[] {
  return BOOSTER_LIST;
}

// A loadout is a list of booster ids chosen for one run (at most one of
// each). Kept as a plain string[] so it serialises trivially through the
// scene-launch data.
export function loadoutCost(ids: readonly string[]): number {
  return ids.reduce((sum, id) => sum + (getBooster(id)?.cost ?? 0), 0);
}

// The resolved, board-facing effect bag. Structurally matches BoardScene's
// BoardModifiers — the city resolves it here and hands the plain object to
// the scene, so the board never imports the catalog.
export interface ResolvedBoosterModifiers {
  extraMoves: number;
  headStart: number;
  startRainbow: number;
}

export function resolveBoosterModifiers(ids: readonly string[]): ResolvedBoosterModifiers {
  const mods: ResolvedBoosterModifiers = { extraMoves: 0, headStart: 0, startRainbow: 0 };
  for (const id of ids) {
    const effect = getBooster(id)?.effect;
    if (!effect) continue;
    if (effect.kind === "extraMoves") mods.extraMoves += effect.amount;
    else if (effect.kind === "headStart") mods.headStart = Math.max(mods.headStart, effect.amount);
    else if (effect.kind === "startRainbow") mods.startRainbow += effect.amount;
  }
  return mods;
}
