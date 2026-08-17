import { describe, expect, it } from "vitest";
import {
  applyRelaxMode,
  isRelaxModeEnabled,
  setRelaxModeEnabled,
  type RelaxModeStorage,
} from "@/settings/relaxMode";

class FakeStorage implements RelaxModeStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("relax mode storage", () => {
  it("defaults to disabled when nothing is stored", () => {
    const storage = new FakeStorage();
    expect(isRelaxModeEnabled(storage)).toBe(false);
  });

  it("round-trips the enabled flag", () => {
    const storage = new FakeStorage();
    setRelaxModeEnabled(true, storage);
    expect(isRelaxModeEnabled(storage)).toBe(true);
    setRelaxModeEnabled(false, storage);
    expect(isRelaxModeEnabled(storage)).toBe(false);
  });
});

describe("applyRelaxMode", () => {
  it("returns the move limit unchanged when disabled", () => {
    expect(applyRelaxMode(20, false)).toBe(20);
  });

  it("increases the move limit by 1.5x, rounded up, when enabled", () => {
    expect(applyRelaxMode(20, true)).toBe(30);
    expect(applyRelaxMode(15, true)).toBe(23);
  });
});
