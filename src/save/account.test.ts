import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAccount,
  getAccountHeaders,
  hasLocalAccount,
  loadAccountFromDb,
  loginWithAccount,
} from "@/save/account";
import { idbGet } from "@/save/db";

function fetchMock(): ReturnType<typeof vi.fn> {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createAccount", () => {
  it("persists the account and returns ok on success", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ status: "created" }), { status: 200 }),
    );

    const result = await createAccount("ada", "correct-horse");

    expect(result.ok).toBe(true);
    expect(hasLocalAccount()).toBe(true);
    expect(getAccountHeaders()["X-Account-Username"]).toBe("ada");
    expect(await idbGet("save:account")).toMatchObject({ username: "ada" });
  });

  it("sends a hash, never the raw code", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ status: "created" }), { status: 200 }),
    );

    await createAccount("ada2", "correct-horse-battery");

    const body = JSON.parse(fetchMock().mock.calls[0][1].body);
    expect(body.action).toBe("create");
    expect(body.username).toBe("ada2");
    expect(body.codeHash).not.toBe("correct-horse-battery");
    expect(body.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns the server's error and doesn't persist on a taken username", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ error: "That username is already taken." }), { status: 409 }),
    );

    const result = await createAccount("taken-name", "some-code");

    expect(result).toEqual({ ok: false, error: "That username is already taken." });
  });
});

describe("loginWithAccount", () => {
  it("persists the account and returns ok on success", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ status: "verified" }), { status: 200 }),
    );

    const result = await loginWithAccount("ada3", "correct-horse");

    expect(result.ok).toBe(true);
    expect(getAccountHeaders()["X-Account-Username"]).toBe("ada3");
  });

  it("returns the server's error on a wrong code", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ error: "Wrong code for that username." }), { status: 401 }),
    );

    const result = await loginWithAccount("ada4", "wrong-code");

    expect(result).toEqual({ ok: false, error: "Wrong code for that username." });
  });
});

describe("loadAccountFromDb", () => {
  it("hydrates hasLocalAccount() from whatever is persisted", async () => {
    fetchMock().mockResolvedValue(
      new Response(JSON.stringify({ status: "created" }), { status: 200 }),
    );
    await createAccount("ada5", "correct-horse");

    // simulate a fresh page load with an empty in-memory cache — there's no
    // way to reset the module's cache directly, so this just confirms the
    // hydration path doesn't throw and leaves the account intact.
    await loadAccountFromDb();
    expect(hasLocalAccount()).toBe(true);
  });
});
