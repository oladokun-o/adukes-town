import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAccount, getAccountHeaders } from "@/save/account";
import { getCityState, storeCityState } from "@/game/city/cityState";
import { createDefaultCityState } from "@/game/city/types";
import { pullFromCloud, pushToCloud } from "@/save/cloudSync";

function fetchMock(): ReturnType<typeof vi.fn> {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn());
  // Every test needs a local account for getAccountHeaders() to succeed —
  // establish one against a mocked /api/account response, then each test
  // reconfigures the mock for its own /api/save call.
  fetchMock().mockResolvedValueOnce(
    new Response(JSON.stringify({ status: "created" }), { status: 200 }),
  );
  await createAccount("cloud-sync-test", "some-code");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pushToCloud", () => {
  it("PUTs the exported save to /api/save with the account headers", async () => {
    await storeCityState({ ...createDefaultCityState(), coins: 33 });
    fetchMock().mockResolvedValue(new Response(null, { status: 200 }));

    await pushToCloud();

    expect(fetch).toHaveBeenCalledTimes(2); // account creation + this push
    const [url, init] = fetchMock().mock.calls[1] as [
      string,
      { method: string; headers: Record<string, string>; body: string },
    ];
    expect(url).toBe("/api/save");
    expect(init.method).toBe("PUT");
    expect(init.headers["X-Account-Username"]).toBe(getAccountHeaders()["X-Account-Username"]);

    const body = JSON.parse(init.body);
    expect(body.city.coins).toBe(33);
  });

  it("throws when the server responds with an error status", async () => {
    fetchMock().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(pushToCloud()).rejects.toThrow(/500/);
  });

  it("propagates a network failure so the caller can handle it", async () => {
    fetchMock().mockRejectedValue(new Error("offline"));
    await expect(pushToCloud()).rejects.toThrow("offline");
  });
});

describe("pullFromCloud", () => {
  it("returns false when there's no cloud save yet (404)", async () => {
    fetchMock().mockResolvedValue(new Response(null, { status: 404 }));
    await expect(pullFromCloud()).resolves.toBe(false);
  });

  it("imports the bundle and returns true on success", async () => {
    const bundle = {
      schemaVersion: 1,
      progress: {},
      relaxMode: false,
      city: { ...createDefaultCityState(), coins: 77 },
    };
    fetchMock().mockResolvedValue(new Response(JSON.stringify(bundle), { status: 200 }));

    await expect(pullFromCloud()).resolves.toBe(true);
    expect(getCityState().coins).toBe(77);
  });

  it("throws on a response that isn't a valid save bundle", async () => {
    fetchMock().mockResolvedValue(new Response(JSON.stringify({ nope: true }), { status: 200 }));
    await expect(pullFromCloud()).rejects.toThrow(/valid/i);
  });

  it("throws when the server responds with an error status", async () => {
    fetchMock().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(pullFromCloud()).rejects.toThrow(/500/);
  });
});
