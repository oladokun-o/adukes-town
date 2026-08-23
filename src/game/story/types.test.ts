import { describe, expect, it } from "vitest";
import { createDefaultStoryState } from "@/game/story/types";

describe("createDefaultStoryState", () => {
  it("starts Dapo with no visits and nothing discovered or acted on", () => {
    const state = createDefaultStoryState();
    expect(state.characters.dapo).toEqual({
      visits: 0,
      discoveredFactIds: [],
      actedOnFactIds: [],
    });
  });

  it("returns an independent object each call, safe to mutate", () => {
    const a = createDefaultStoryState();
    const b = createDefaultStoryState();
    a.characters.dapo.visits = 5;
    a.characters.dapo.discoveredFactIds.push("garlic-sauce");
    expect(b.characters.dapo.visits).toBe(0);
    expect(b.characters.dapo.discoveredFactIds).toEqual([]);
  });
});
