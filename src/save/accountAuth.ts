// Minimal shape both the real @upstash/redis client and a test fake satisfy
// — decouples this module from Upstash's exact client type.
export interface AccountStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
}

export type AccountAction = "create" | "login";

export type AccountResult =
  | { status: "created" }
  | { status: "verified" }
  | { status: "mismatch" }
  | { status: "taken" }
  | { status: "not-found" };

function keyFor(username: string): string {
  return `account:${normalizeUsername(username)}`;
}

// Case/whitespace shouldn't matter for "is this the same username" — avoids
// her ending up with two accounts because a device auto-capitalized once.
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return /^[a-z0-9_-]{2,32}$/.test(normalized);
}

// Deliberately split from a single "upsert" so the client's intent matters:
// - "create" must never silently succeed as a login on an existing username
//   (that would misreport a typo'd, already-taken name as available).
// - "login" must never silently create a new blank account on a typo'd
//   username (that would look like a successful restore and then bury the
//   real account with nothing shown for it).
export async function resolveAccount(
  store: AccountStore,
  action: AccountAction,
  username: string,
  codeHash: string,
): Promise<AccountResult> {
  const stored = await store.get(keyFor(username));

  if (action === "create") {
    if (stored) return { status: "taken" };
    await store.set(keyFor(username), codeHash);
    return { status: "created" };
  }

  if (!stored) return { status: "not-found" };
  return stored === codeHash ? { status: "verified" } : { status: "mismatch" };
}

// Used to authenticate save reads/writes (api/save.ts) — verification only,
// never creates an account as a side effect.
export async function verifyAccount(
  store: AccountStore,
  username: string,
  codeHash: string,
): Promise<boolean> {
  const stored = await store.get(keyFor(username));
  return stored === codeHash;
}
