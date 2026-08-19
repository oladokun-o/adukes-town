import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      get: async (key: string) => store.get(key) ?? null,
      set: async (key: string, value: string) => {
        store.set(key, value);
        return "OK";
      },
    }),
  },
}));

const handler = (await import("../api/account")).default;

interface MockReq {
  method: string;
  body?: unknown;
}

function mockReq(overrides: Partial<MockReq> = {}): MockReq {
  return { method: "POST", ...overrides };
}

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  res.status.mockImplementation(() => res);
  res.json.mockImplementation(() => res);
  return res;
}

type Handler = (req: never, res: never) => Promise<void>;
const call = handler as unknown as Handler;

beforeEach(() => store.clear());

describe("api/account", () => {
  it("creates a new account for an unclaimed username", async () => {
    const res = mockRes();
    await call(
      mockReq({ body: { action: "create", username: "ada", codeHash: "hash1" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "created" });
  });

  it("rejects create on an already-claimed username", async () => {
    await call(
      mockReq({ body: { action: "create", username: "ada", codeHash: "hash1" } }) as never,
      mockRes() as never,
    );

    const res = mockRes();
    await call(
      mockReq({ body: { action: "create", username: "ada", codeHash: "hash2" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("logs in with a matching hash", async () => {
    await call(
      mockReq({ body: { action: "create", username: "ada", codeHash: "hash1" } }) as never,
      mockRes() as never,
    );

    const res = mockRes();
    await call(
      mockReq({ body: { action: "login", username: "ada", codeHash: "hash1" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "verified" });
  });

  it("rejects login with a wrong code", async () => {
    await call(
      mockReq({ body: { action: "create", username: "ada", codeHash: "hash1" } }) as never,
      mockRes() as never,
    );

    const res = mockRes();
    await call(
      mockReq({ body: { action: "login", username: "ada", codeHash: "wrong" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects login on an unknown username", async () => {
    const res = mockRes();
    await call(
      mockReq({ body: { action: "login", username: "nobody", codeHash: "hash1" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("rejects an invalid username", async () => {
    const res = mockRes();
    await call(
      mockReq({ body: { action: "create", username: "a", codeHash: "hash1" } }) as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a missing action", async () => {
    const res = mockRes();
    await call(mockReq({ body: { username: "ada", codeHash: "hash1" } }) as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 405 for non-POST methods", async () => {
    const res = mockRes();
    await call(mockReq({ method: "GET" }) as never, res as never);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
