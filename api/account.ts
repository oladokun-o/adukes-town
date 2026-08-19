import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
// Relative import, not the `@/` alias — see api/save.ts for why.
import { isValidUsername, resolveAccount, type AccountAction } from "../src/save/accountAuth";

const redis = Redis.fromEnv();

interface AccountRequestBody {
  action?: unknown;
  username?: unknown;
  codeHash?: unknown;
}

function isAccountAction(value: unknown): value is AccountAction {
  return value === "create" || value === "login";
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = req.body as AccountRequestBody;
  if (!isAccountAction(body.action)) {
    res.status(400).json({ error: 'action must be "create" or "login".' });
    return;
  }
  if (typeof body.username !== "string" || !isValidUsername(body.username)) {
    res.status(400).json({
      error: "Username must be 2-32 characters: letters, numbers, - or _.",
    });
    return;
  }
  if (typeof body.codeHash !== "string" || body.codeHash.length === 0) {
    res.status(400).json({ error: "Missing code." });
    return;
  }

  const result = await resolveAccount(redis, body.action, body.username, body.codeHash);

  switch (result.status) {
    case "created":
      res.status(200).json({ status: "created" });
      return;
    case "verified":
      res.status(200).json({ status: "verified" });
      return;
    case "mismatch":
      res.status(401).json({ error: "Wrong code for that username." });
      return;
    case "taken":
      res.status(409).json({ error: "That username is already taken." });
      return;
    case "not-found":
      res.status(404).json({ error: "No account with that username." });
      return;
  }
}
