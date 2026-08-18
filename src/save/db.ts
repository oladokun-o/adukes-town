import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface AdukesTownDB extends DBSchema {
  kv: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "adukes-town";
const DB_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise: Promise<IDBPDatabase<AdukesTownDB>> | null = null;

function getDb(): Promise<IDBPDatabase<AdukesTownDB>> {
  dbPromise ??= openDB<AdukesTownDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, key) as Promise<T | undefined>;
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, value, key);
}

export async function idbDelete(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, key);
}
