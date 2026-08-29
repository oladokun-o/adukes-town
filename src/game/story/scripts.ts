import type { CharacterId, MemoryFact } from "@/game/story/types";

// Short, fixed, non-branching scripts — one per NPC. Each `Talk` advances
// the visit count and shows the line for that visit (or the last unlocked
// line once the script runs out, so Talk never goes silent). Lines that
// carry a `fact` reveal it into the journal, where it can later be
// Remembered for a payoff.
//
// Fictionalized per the story bible: the specific texture is kept (what
// Dapo cooks, what Simi notices), names and circumstances are changed.

export interface DialogueLine {
  requiresVisits: number;
  line: string;
  fact?: MemoryFact;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  emoji: string;
  role: string;
  script: DialogueLine[];
}

const DAPO: CharacterProfile = {
  id: "dapo",
  name: "Dapo",
  emoji: "🧑🏾‍🍳",
  role: "the one who stayed",
  script: [
    {
      requiresVisits: 1,
      line: `Dapo ladles sauce over your plate without asking. "Still the garlic one. Some things I'm not going to change on you, Slice Bread."`,
      fact: {
        id: "garlic-sauce",
        text: "Dapo still makes the garlic sauce for your spaghetti — always has.",
        responseLine: `"I remembered the garlic sauce," you tell him. He goes a little shy about it, like it lands harder coming from you.`,
      },
    },
    {
      requiresVisits: 2,
      line: `He watches you sort out three problems before lunch and shakes his head. "You don't give yourself the credit. I've seen it for years — even on your off days."`,
      fact: {
        id: "sees-your-capability",
        text: "Dapo said he's always seen how capable you are, even when you can't.",
        responseLine: `You tell him you're trying to believe it too. He just smiles like he already knew you'd get there.`,
      },
    },
    {
      requiresVisits: 3,
      line: `"We should go back to our place by the water soon," he says. "You always think better with sand in your shoes."`,
      fact: {
        id: "our-place",
        text: "Dapo wants to take you back to 'our place' by the water.",
        responseLine: `You plan the trip before you can talk yourself out of it. He texts back a single sun emoji.`,
      },
    },
    {
      requiresVisits: 4,
      line: `He nudges your shoulder. "I just like reminding you of the little things. Feels right — remembering people properly."`,
    },
  ],
};

const SIMI: CharacterProfile = {
  id: "simi",
  name: "Simi",
  emoji: "💁🏾‍♀️",
  role: "the friend, not just a friend",
  script: [
    {
      requiresVisits: 1,
      line: `Simi hugs you too long, like always. "Ten years and you still show up when you say you will. Do you know how rare that is?"`,
      fact: {
        id: "shows-up",
        text: "Simi values that you actually show up when you say you will.",
        responseLine: `You block out a standing evening for her, no agenda. She calls it "the most Aduke thing" you've ever done.`,
      },
    },
    {
      requiresVisits: 2,
      line: `"I hate when people perform being someone," she says, picking at her food. "You never did that with me. Not once."`,
      fact: {
        id: "hates-pretending",
        text: "Simi can't stand people who pretend to be something they're not.",
        responseLine: `You tell her plainly what's actually going on with you lately — no polish. She exhales like she'd been waiting for it.`,
      },
    },
    {
      requiresVisits: 3,
      line: `She squeezes your hand. "Whatever this town becomes, I want a house on the good street. Near you."`,
      fact: {
        id: "wants-to-stay-close",
        text: "Simi wants to live close to you, wherever this ends up.",
        responseLine: `You save the plot next to yours for her and don't tell her yet. It can be a surprise.`,
      },
    },
    {
      requiresVisits: 4,
      line: `"Okay, enough feelings," she says, already grinning. "Feed me. Then feelings."`,
    },
  ],
};

const KEMI: CharacterProfile = {
  id: "kemi",
  name: "Kemi",
  emoji: "👩🏾",
  role: "eldest sister",
  script: [
    {
      requiresVisits: 1,
      line: `Kemi looks around the half-built town and just nods. "You always could make something out of wherever you landed. Even as a kid."`,
      fact: {
        id: "makes-something-anywhere",
        text: "Kemi has always seen that you make something of yourself wherever you go.",
        responseLine: `You send her a photo of the newest street with a note: "Made something again." She replies with the whole row of hearts.`,
      },
    },
    {
      requiresVisits: 2,
      line: `"You take on too much and then go quiet when it's heavy," she says gently. "I know the pattern. I'm your sister."`,
      fact: {
        id: "knows-when-youre-overwhelmed",
        text: "Kemi can tell when you're overwhelmed, even when you hide it.",
        responseLine: `You actually call her on a hard day instead of disappearing. She stays on the line while you sort it out.`,
      },
    },
    {
      requiresVisits: 3,
      line: `"Family like blood," she says, like it's just a fact. "Don't forget you're allowed to lean."`,
    },
  ],
};

const TUNDE: CharacterProfile = {
  id: "tunde",
  name: "Tunde",
  emoji: "🧔🏾",
  role: "older brother",
  script: [
    {
      requiresVisits: 1,
      line: `Tunde tests a fence rail with his boot. "Solid. You measure twice, like Dad. The independent streak's from him too, you know."`,
      fact: {
        id: "wants-independence",
        text: "Tunde sees your drive for financial independence as freedom, not greed.",
        responseLine: `You tell him the real goal isn't money, it's the freedom to choose. "Obviously," he says. "We all knew that but you."`,
      },
    },
    {
      requiresVisits: 2,
      line: `"You'd help someone with your last thousand naira and then act like it was nothing," he says. "It's not nothing."`,
      fact: {
        id: "gives-anyway",
        text: "Tunde has watched you give even when you had little to spare.",
        responseLine: `You quietly cover a neighbour's shortfall at the market. Tunde finds out anyway and doesn't say a word about it — just brings you groundnuts.`,
      },
    },
    { requiresVisits: 3, line: `"Anyway. Roof's next. I'll bring the good ladder this time."` },
  ],
};

const SEUN: CharacterProfile = {
  id: "seun",
  name: "Seun",
  emoji: "🧑🏾",
  role: "younger brother",
  script: [
    {
      requiresVisits: 1,
      line: `Seun flops onto your steps. "You remember everyone's birthday. Mine, Mum's, the woman who sells bread. How?"`,
      fact: {
        id: "remembers-everyone",
        text: "Seun is amazed that you remember everyone's birthdays and small details.",
        responseLine: `You show him the little list you keep. He asks for a copy "for emergencies," meaning he'll forget yours otherwise.`,
      },
    },
    {
      requiresVisits: 2,
      line: `"You used to play Township so much I'd have to call your name twice," he laughs. "Now you built one. That's either very sad or very cool."`,
      fact: {
        id: "the-game-joke",
        text: "Seun teases you about how much you played the game this town is based on.",
        responseLine: `You put a tiny arcade in the town square and name the high score after him. He pretends to be annoyed for exactly one minute.`,
      },
    },
    {
      requiresVisits: 3,
      line: `"Bread and groundnuts?" he says, already holding both. "I remembered."`,
    },
  ],
};

export const PROFILES: Record<CharacterId, CharacterProfile> = {
  dapo: DAPO,
  simi: SIMI,
  kemi: KEMI,
  tunde: TUNDE,
  seun: SEUN,
};

export function getProfile(id: CharacterId): CharacterProfile {
  return PROFILES[id];
}

// The line for exactly this visit count, or the last unlocked one if the
// script has run out.
export function getLineForVisit(id: CharacterId, visits: number): DialogueLine | null {
  const script = PROFILES[id].script;
  const exact = script.find((entry) => entry.requiresVisits === visits);
  if (exact) return exact;
  const unlocked = script.filter((entry) => entry.requiresVisits <= visits);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function getAllFacts(id: CharacterId): MemoryFact[] {
  return PROFILES[id].script.flatMap((entry) => (entry.fact ? [entry.fact] : []));
}
