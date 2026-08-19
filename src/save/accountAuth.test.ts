import { describe, expect, it } from "vitest";
import {
  isValidUsername,
  normalizeUsername,
  resolveAccount,
  verifyAccount,
  type AccountStore,
} from "@/save/accountAuth";

function fakeStore(): AccountStore {
  const data = new Map<string, string>();
  return {
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
      return "OK";
    },
  };
}

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  Ada  ")).toBe("ada");
  });
});

describe("isValidUsername", () => {
  it("accepts alphanumeric names with dashes/underscores, 2-32 chars", () => {
    expect(isValidUsername("ada")).toBe(true);
    expect(isValidUsername("ada-lovelace_1")).toBe(true);
  });

  it("rejects too-short, too-long, or invalid-character names", () => {
    expect(isValidUsername("a")).toBe(false);
    expect(isValidUsername("a".repeat(33))).toBe(false);
    expect(isValidUsername("ada lovelace")).toBe(false);
    expect(isValidUsername("ada!")).toBe(false);
  });
});

describe("resolveAccount", () => {
  it("creates a new account for an unclaimed username", async () => {
    const store = fakeStore();
    await expect(resolveAccount(store, "create", "ada", "hash1")).resolves.toEqual({
      status: "created",
    });
  });

  it("rejects create on an already-claimed username", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "ada", "hash1");
    await expect(resolveAccount(store, "create", "ada", "hash2")).resolves.toEqual({
      status: "taken",
    });
  });

  it("logs in with a matching hash", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "ada", "hash1");
    await expect(resolveAccount(store, "login", "ada", "hash1")).resolves.toEqual({
      status: "verified",
    });
  });

  it("rejects login with a mismatched hash", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "ada", "hash1");
    await expect(resolveAccount(store, "login", "ada", "wrong-hash")).resolves.toEqual({
      status: "mismatch",
    });
  });

  it("rejects login on an unknown username instead of creating one", async () => {
    const store = fakeStore();
    await expect(resolveAccount(store, "login", "nobody", "hash1")).resolves.toEqual({
      status: "not-found",
    });
  });

  it("treats usernames as case/whitespace-insensitive", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "Ada", "hash1");
    await expect(resolveAccount(store, "login", "  ada  ", "hash1")).resolves.toEqual({
      status: "verified",
    });
  });
});

describe("verifyAccount", () => {
  it("returns true for a matching hash", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "ada", "hash1");
    expect(await verifyAccount(store, "ada", "hash1")).toBe(true);
  });

  it("returns false for a missing account", async () => {
    const store = fakeStore();
    expect(await verifyAccount(store, "nobody", "hash1")).toBe(false);
  });

  it("returns false for a mismatched hash", async () => {
    const store = fakeStore();
    await resolveAccount(store, "create", "ada", "hash1");
    expect(await verifyAccount(store, "ada", "wrong")).toBe(false);
  });
});
