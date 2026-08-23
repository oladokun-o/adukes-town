import { describe, expect, it } from "vitest";
import { rememberFact, visitCharacter } from "@/game/story/storyActions";
import { createDefaultStoryState } from "@/game/story/types";

describe("visitCharacter", () => {
  it("increments visits", () => {
    const state = visitCharacter(createDefaultStoryState(), "dapo");
    expect(state.characters.dapo.visits).toBe(1);
  });

  it("reveals the fact due on this visit", () => {
    const state = visitCharacter(createDefaultStoryState(), "dapo");
    expect(state.characters.dapo.discoveredFactIds).toEqual(["garlic-sauce"]);
  });

  it("accumulates facts across repeated visits", () => {
    let state = createDefaultStoryState();
    state = visitCharacter(state, "dapo");
    state = visitCharacter(state, "dapo");
    expect(state.characters.dapo.discoveredFactIds).toEqual([
      "garlic-sauce",
      "sees-your-capability",
    ]);
  });

  it("doesn't duplicate a fact if visited past where the script repeats the last line", () => {
    let state = createDefaultStoryState();
    for (let i = 0; i < 6; i++) state = visitCharacter(state, "dapo");
    expect(state.characters.dapo.visits).toBe(6);
    expect(state.characters.dapo.discoveredFactIds).toEqual([
      "garlic-sauce",
      "sees-your-capability",
    ]);
  });
});

describe("rememberFact", () => {
  it("is a no-op on an undiscovered fact", () => {
    const state = createDefaultStoryState();
    expect(rememberFact(state, "dapo", "garlic-sauce")).toBe(state);
  });

  it("marks a discovered fact as acted on", () => {
    const state = visitCharacter(createDefaultStoryState(), "dapo");
    const next = rememberFact(state, "dapo", "garlic-sauce");
    expect(next.characters.dapo.actedOnFactIds).toEqual(["garlic-sauce"]);
  });

  it("is a no-op if the fact was already acted on", () => {
    let state = visitCharacter(createDefaultStoryState(), "dapo");
    state = rememberFact(state, "dapo", "garlic-sauce");
    expect(rememberFact(state, "dapo", "garlic-sauce")).toBe(state);
  });
});
