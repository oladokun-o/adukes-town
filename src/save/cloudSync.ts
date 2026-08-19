import { getAccountHeaders } from "@/save/account";
import { exportSave, importSave } from "@/save/backup";
import { isSaveBundle } from "@/save/saveBundleSchema";

const SAVE_ENDPOINT = "/api/save";

// Push mirrors "this device's current state" to the cloud, so it's always
// safe to run automatically (see main.ts's pagehide listener). Pull can
// overwrite newer local progress with stale cloud data, so it's never
// automatic — only ever triggered by an explicit user action, same trust
// model as the existing local "Import Save" button already has.
export async function pushToCloud(): Promise<void> {
  const response = await fetch(SAVE_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAccountHeaders(),
    },
    body: JSON.stringify(exportSave()),
    // Lets the request outlive the page when triggered from a `pagehide`
    // listener (main.ts) instead of being cut off mid-flight. The save
    // bundle is well under keepalive's ~64KB body limit.
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Cloud save failed (${response.status}).`);
  }
}

// Returns false (not an error) when there's simply no cloud save yet —
// callers only need to distinguish "restored" from "nothing to restore".
export async function pullFromCloud(): Promise<boolean> {
  const response = await fetch(SAVE_ENDPOINT, {
    headers: getAccountHeaders(),
  });

  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`Couldn't reach the cloud save (${response.status}).`);
  }

  const bundle: unknown = await response.json();
  if (!isSaveBundle(bundle)) {
    throw new Error("The cloud save doesn't look like a valid Aduke's Town save.");
  }

  await importSave(bundle);
  return true;
}
