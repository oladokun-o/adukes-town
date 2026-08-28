import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      get: async (key: string) => store.get(key) ?? null,
      set: async (key: string, value: unknown) => {
        store.set(key, value);
        return "OK";
      },
    }),
  },
}));

const handler = (await import("../api/save")).default;
const { createDefaultCityState } = await import("@/game/city/types");

const USERNAME = "ada";
const CODE_HASH = "hash1";
const ACCOUNT_HEADERS = { "x-account-username": USERNAME, "x-account-code-hash": CODE_HASH };

interface MockReq {
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

function mockReq(overrides: Partial<MockReq> = {}): MockReq {
  return { method: "GET", headers: {}, ...overrides };
}

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockImplementation(() => res);
  res.json.mockImplementation(() => res);
  return res;
}

type Handler = (req: never, res: never) => Promise<void>;
const call = handler as unknown as Handler;

beforeEach(() => {
  store.clear();
  // Pre-seed a verified account — api/save.ts's own concern is save data,
  // not account creation, so it's simpler to seed the store directly than
  // to route through api/account.ts here.
  store.set(`account:${USERNAME}`, CODE_HASH);
});

describe("api/save", () => {
  it("returns 400 when the account headers are missing", async () => {
    const res = mockRes();
    await call(mockReq() as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 for an unknown account or wrong code", async () => {
    const res = mockRes();
    await call(
      mockReq({
        headers: { "x-account-username": "ada", "x-account-code-hash": "wrong" },
      }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 404 when nothing is stored for the account", async () => {
    const res = mockRes();
    await call(mockReq({ headers: ACCOUNT_HEADERS }) as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("stores then retrieves a valid bundle", async () => {
    const bundle = {
      schemaVersion: 1,
      progress: {},
      relaxMode: false,
      city: createDefaultCityState(),
    };

    const putRes = mockRes();
    await call(
      mockReq({ method: "PUT", headers: ACCOUNT_HEADERS, body: bundle }) as never,
      putRes as never,
    );
    expect(putRes.status).toHaveBeenCalledWith(200);

    const getRes = mockRes();
    await call(mockReq({ headers: ACCOUNT_HEADERS }) as never, getRes as never);
    expect(getRes.status).toHaveBeenCalledWith(200);
    expect(getRes.json).toHaveBeenCalledWith(bundle);
  });

  it("round-trips a current (v3) bundle", async () => {
    const bundle = {
      schemaVersion: 3,
      progress: {},
      relaxMode: false,
      city: createDefaultCityState(),
    };
    const putRes = mockRes();
    await call(
      mockReq({ method: "PUT", headers: ACCOUNT_HEADERS, body: bundle }) as never,
      putRes as never,
    );
    expect(putRes.status).toHaveBeenCalledWith(200);

    const getRes = mockRes();
    await call(mockReq({ headers: ACCOUNT_HEADERS }) as never, getRes as never);
    expect(getRes.json).toHaveBeenCalledWith(bundle);
  });

  it("rejects a malformed body on PUT", async () => {
    const res = mockRes();
    await call(
      mockReq({ method: "PUT", headers: ACCOUNT_HEADERS, body: { nope: true } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("keeps saves for different accounts separate", async () => {
    store.set("account:bella", "hash2");
    const bundleA = {
      schemaVersion: 1,
      progress: {},
      relaxMode: false,
      city: createDefaultCityState(),
    };
    const bundleB = {
      schemaVersion: 1,
      progress: {},
      relaxMode: true,
      city: createDefaultCityState(),
    };

    await call(
      mockReq({ method: "PUT", headers: ACCOUNT_HEADERS, body: bundleA }) as never,
      mockRes() as never,
    );
    await call(
      mockReq({
        method: "PUT",
        headers: { "x-account-username": "bella", "x-account-code-hash": "hash2" },
        body: bundleB,
      }) as never,
      mockRes() as never,
    );

    const resA = mockRes();
    await call(mockReq({ headers: ACCOUNT_HEADERS }) as never, resA as never);
    expect(resA.json).toHaveBeenCalledWith(bundleA);
  });

  it("returns 405 for unsupported methods", async () => {
    const res = mockRes();
    await call(mockReq({ method: "DELETE", headers: ACCOUNT_HEADERS }) as never, res as never);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
