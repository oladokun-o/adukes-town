// Requests protection from iOS Safari's 7-day storage-eviction sweep (see
// docs/reference/03-technical-architecture.md §3.1). Browsers vary in
// whether/when they grant this — there's no useful UI to build around a
// permission the user can't directly control, so this just logs the
// outcome for later debugging and never blocks or gates anything else.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;

  try {
    const granted = await navigator.storage.persist();
    console.info(`Aduke's Town: persistent storage ${granted ? "granted" : "not granted"}.`);
    return granted;
  } catch (err) {
    console.warn("Aduke's Town: couldn't request persistent storage.", err);
    return false;
  }
}
