import { idbGet, idbSet } from "@/save/db";

const IDB_KEY = "save:account";
const ACCOUNT_ENDPOINT = "/api/account";

interface StoredAccount {
  username: string;
  codeHash: string;
}

export interface AccountResult {
  ok: boolean;
  error?: string;
}

// Read-through cache, same shape as every other settings module. Unlike
// relaxMode.ts's boolean or syncToken.ts's opaque UUID, this holds an
// account identity — {username, codeHash} — a real person can type into a
// new device to restore their save, which an anonymous per-device token
// never could.
let accountCache: StoredAccount | null = null;

export function hasLocalAccount(): boolean {
  return accountCache !== null;
}

// Used by cloudSync.ts to authenticate save reads/writes. Throws rather
// than silently sending an unauthenticated request — a caller reaching
// this without an account first is a bug (main.ts's boot order guards it).
export function getAccountHeaders(): Record<string, string> {
  if (!accountCache) throw new Error("No local account to sync with.");
  return {
    "X-Account-Username": accountCache.username,
    "X-Account-Code-Hash": accountCache.codeHash,
  };
}

// SHA-256 via Web Crypto (global in both the browser and Node, no new
// dependency) — the raw code never leaves this device or sits in Redis,
// even though nothing here is genuinely high-stakes.
async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body) {
    return String((body as { error: unknown }).error);
  }
  return undefined;
}

async function submitAccount(
  action: "create" | "login",
  username: string,
  code: string,
): Promise<AccountResult> {
  const codeHash = await hashCode(code);
  const response = await fetch(ACCOUNT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, username, codeHash }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: (await readErrorMessage(response)) ?? `Request failed (${response.status}).`,
    };
  }

  accountCache = { username, codeHash };
  await idbSet(IDB_KEY, accountCache);
  return { ok: true };
}

export function createAccount(username: string, code: string): Promise<AccountResult> {
  return submitAccount("create", username, code);
}

export function loginWithAccount(username: string, code: string): Promise<AccountResult> {
  return submitAccount("login", username, code);
}

// Call once at app bootstrap, before anything checks hasLocalAccount().
export async function loadAccountFromDb(): Promise<void> {
  const stored = await idbGet<StoredAccount>(IDB_KEY);
  if (stored) accountCache = stored;
}
