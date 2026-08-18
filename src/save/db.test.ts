import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { idbDelete, idbGet, idbSet } from "@/save/db";

describe("db", () => {
  it("returns undefined for a key that was never set", async () => {
    expect(await idbGet("never-set")).toBeUndefined();
  });

  it("round-trips a structured value", async () => {
    await idbSet("round-trip", { Red: 8, Blue: 3 });
    expect(await idbGet("round-trip")).toEqual({ Red: 8, Blue: 3 });
  });

  it("overwrites an existing value on set", async () => {
    await idbSet("overwrite", { Red: 1 });
    await idbSet("overwrite", { Red: 2 });
    expect(await idbGet("overwrite")).toEqual({ Red: 2 });
  });

  it("delete removes a stored value", async () => {
    await idbSet("to-delete", true);
    await idbDelete("to-delete");
    expect(await idbGet("to-delete")).toBeUndefined();
  });

  it("keeps distinct keys separate", async () => {
    await idbSet("key-a", "a");
    await idbSet("key-b", "b");
    expect(await idbGet("key-a")).toBe("a");
    expect(await idbGet("key-b")).toBe("b");
  });
});
