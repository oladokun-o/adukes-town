import { describe, expect, it } from "vitest";
import { addItems, barnFree, barnUsed, hasItems, removeItems } from "@/game/city/barn";
import { createDefaultCityState } from "@/game/city/types";

describe("barnUsed / barnFree", () => {
  it("sums every stack in the inventory", () => {
    expect(barnUsed({ a: 3, b: 2 })).toBe(5);
    expect(barnUsed({})).toBe(0);
  });

  it("barnFree is capacity minus used, clamped at zero", () => {
    const state = { ...createDefaultCityState(), barnCapacity: 10, inventory: { a: 4 } };
    expect(barnFree(state)).toBe(6);
    expect(barnFree({ ...state, inventory: { a: 40 } })).toBe(0);
  });
});

describe("addItems", () => {
  it("adds to an existing stack without mutating the input", () => {
    const inv = { a: 1 };
    expect(addItems(inv, "a", 2)).toEqual({ a: 3 });
    expect(inv).toEqual({ a: 1 });
  });

  it("is a no-op for a non-positive quantity", () => {
    const inv = { a: 1 };
    expect(addItems(inv, "a", 0)).toBe(inv);
  });
});

describe("removeItems", () => {
  it("deletes the key when the stack hits zero", () => {
    expect(removeItems({ a: 2, b: 1 }, "a", 2)).toEqual({ b: 1 });
  });

  it("clamps at zero rather than going negative", () => {
    expect(removeItems({ a: 1 }, "a", 5)).toEqual({});
  });
});

describe("hasItems", () => {
  it("is true only when every requirement is met", () => {
    expect(hasItems({ a: 3, b: 1 }, { a: 2, b: 1 })).toBe(true);
    expect(hasItems({ a: 1 }, { a: 2 })).toBe(false);
    expect(hasItems({}, {})).toBe(true);
  });
});
