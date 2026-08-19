import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
// Relative imports, not the `@/` alias: Vercel's function bundler isn't
// guaranteed to resolve Vite's tsconfig path mapping the same way Vite does.
import { normalizeUsername, verifyAccount } from "../src/save/accountAuth";
import { isSaveBundle, type SaveBundle } from "../src/save/saveBundleSchema";

const redis = Redis.fromEnv();

// Normalized the same way accountAuth.ts keys the account itself — "Ada"
// and "ada" must resolve to the same save, not two different ones.
function keyFor(username: string): string {
  return `save:${normalizeUsername(username)}`;
}

// One save blob per account, keyed by a self-chosen username the player
// created during onboarding (src/city/Onboarding.svelte). A username alone
// is guessable in a way a random token wasn't, so every read/write is
// verified against the account's code hash — the same check
// api/account.ts's login path does.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const username = req.headers["x-account-username"];
  const codeHash = req.headers["x-account-code-hash"];
  if (typeof username !== "string" || !username || typeof codeHash !== "string" || !codeHash) {
    res.status(400).json({ error: "Missing account headers." });
    return;
  }

  if (!(await verifyAccount(redis, username, codeHash))) {
    res.status(401).json({ error: "Invalid account credentials." });
    return;
  }

  if (req.method === "GET") {
    const stored = await redis.get<SaveBundle>(keyFor(username));
    if (!stored) {
      res.status(404).json({ error: "No cloud save found for this account." });
      return;
    }
    res.status(200).json(stored);
    return;
  }

  if (req.method === "PUT") {
    const body: unknown = req.body;
    if (!isSaveBundle(body)) {
      res.status(400).json({ error: "Request body is not a valid save bundle." });
      return;
    }
    await redis.set(keyFor(username), body);
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  res.status(405).json({ error: "Method not allowed." });
}
