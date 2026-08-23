import type { CharacterId, MemoryFact } from "@/game/story/types";

export interface DialogueLine {
  requiresVisits: number;
  line: string;
  // Present only on the visit where a new fact is revealed.
  fact?: MemoryFact;
}

// A short, fixed, non-branching script — proving the Remember loop (share,
// track, recall, consequence) with one character before any branching
// dialogue or second character. Fictionalized per the story bible's own
// instruction: real people are the inspiration, not a literal depiction —
// names and surrounding detail are changed, while the specific texture
// (what he cooks, what he notices about her) is kept, since specificity is
// what the story bible's own tone guidance says makes this land.
const DAPO_SCRIPT: DialogueLine[] = [
  {
    requiresVisits: 1,
    line: `Dapo grins as he ladles sauce over your plate. "You know I still make that garlic sauce for your spaghetti, right? Some things don't change."`,
    fact: {
      id: "garlic-sauce",
      text: "He still makes garlic sauce for your spaghetti, just like always.",
      responseLine: `"I remembered the garlic sauce," you tell him. He laughs, surprised you'd bring it up — like it means more, coming from you.`,
    },
  },
  {
    requiresVisits: 2,
    line: `He goes quiet for a second, thinking. "You don't give yourself enough credit, you know that? I've always seen it — even on the days you don't."`,
    fact: {
      id: "sees-your-capability",
      text: "He said he's always seen how capable you are, even when you don't.",
      responseLine: `You tell him you've been thinking about what he said — that you're trying to believe it too. He just smiles, like he already knew you would.`,
    },
  },
  {
    requiresVisits: 3,
    line: `"Anyway," he says, nudging your shoulder, "I just like reminding you of the little things. Feels right, remembering people properly."`,
  },
];

const SCRIPTS: Record<CharacterId, DialogueLine[]> = {
  dapo: DAPO_SCRIPT,
};

// The line for exactly this visit count, or the last unlocked line if the
// script has run out — so "Talk" always has something to show rather than
// going silent once the fixed script is exhausted.
export function getLineForVisit(id: CharacterId, visits: number): DialogueLine | null {
  const script = SCRIPTS[id];
  const exact = script.find((entry) => entry.requiresVisits === visits);
  if (exact) return exact;

  const unlocked = script.filter((entry) => entry.requiresVisits <= visits);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function getAllFacts(id: CharacterId): MemoryFact[] {
  return SCRIPTS[id].flatMap((entry) => (entry.fact ? [entry.fact] : []));
}
