import { describe, expect, it } from "vitest";
import { getAllFacts, getLineForVisit } from "@/game/story/dapo";

describe("getLineForVisit", () => {
  it("returns null before the first visit", () => {
    expect(getLineForVisit("dapo", 0)).toBeNull();
  });

  it("returns the matching line for an exact visit count", () => {
    const line = getLineForVisit("dapo", 1);
    expect(line?.fact?.id).toBe("garlic-sauce");
  });

  it("returns a different fact on the second visit", () => {
    const line = getLineForVisit("dapo", 2);
    expect(line?.fact?.id).toBe("sees-your-capability");
  });

  it("has no new fact on the third (closing) line", () => {
    const line = getLineForVisit("dapo", 3);
    expect(line?.fact).toBeUndefined();
  });

  it("repeats the last unlocked line once the script is exhausted", () => {
    const atEnd = getLineForVisit("dapo", 3);
    const beyond = getLineForVisit("dapo", 10);
    expect(beyond).toEqual(atEnd);
  });
});

describe("getAllFacts", () => {
  it("lists every fact the script can reveal, in order", () => {
    const facts = getAllFacts("dapo");
    expect(facts.map((fact) => fact.id)).toEqual(["garlic-sauce", "sees-your-capability"]);
  });
});
