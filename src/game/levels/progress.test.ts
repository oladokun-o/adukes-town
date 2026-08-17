import { describe, expect, it } from "vitest";
import {
  clearProgress,
  getStoredProgress,
  storeProgress,
  type ProgressStorage,
} from "@/game/levels/progress";

class FakeStorage implements ProgressStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("progress", () => {
  it("returns {} when nothing is stored", () => {
    const storage = new FakeStorage();
    expect(getStoredProgress("level001", storage)).toEqual({});
  });

  it("round-trips stored progress", () => {
    const storage = new FakeStorage();
    storeProgress("level001", { Red: 8, Blue: 3 }, storage);
    expect(getStoredProgress("level001", storage)).toEqual({ Red: 8, Blue: 3 });
  });

  it("clear removes stored progress", () => {
    const storage = new FakeStorage();
    storeProgress("level001", { Red: 8 }, storage);
    clearProgress("level001", storage);
    expect(getStoredProgress("level001", storage)).toEqual({});
  });

  it("keeps progress for different levels separate", () => {
    const storage = new FakeStorage();
    storeProgress("level001", { Red: 8 }, storage);
    storeProgress("level002", { Blue: 2 }, storage);
    expect(getStoredProgress("level001", storage)).toEqual({ Red: 8 });
    expect(getStoredProgress("level002", storage)).toEqual({ Blue: 2 });
  });

  it("returns {} when stored value is malformed JSON", () => {
    const storage = new FakeStorage();
    storage.setItem("adukes-town:progress:level001", "not json");
    expect(getStoredProgress("level001", storage)).toEqual({});
  });
});
