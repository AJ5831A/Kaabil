import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "@/lib/types";
import { createSeed } from "./seed";

/**
 * Persistence adapter. Pilot build: a JSON document on disk (`.data/`, or /tmp on
 * serverless). The repository functions in ./repo.ts are the only callers, so this
 * file is the single swap-point for Postgres (Neon) via Drizzle — see README.
 */
const DIR = process.env.KAABIL_DATA_DIR || (process.env.VERCEL ? "/tmp/kaabil" : path.join(process.cwd(), ".data"));
const FILE = path.join(DIR, "kaabil-db.json");

let cache: Database | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<Database> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    cache = { ...createSeed(), ...(JSON.parse(raw) as Partial<Database>) } as Database;
  } catch {
    cache = createSeed();
    await persist(cache);
  }
  return cache;
}

async function persist(db: Database) {
  writeChain = writeChain.then(async () => {
    try {
      await fs.mkdir(DIR, { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2));
      await fs.rename(tmp, FILE);
    } catch (err) {
      // Read-only filesystem: keep working in memory.
      console.warn("[db] persist failed, continuing in-memory:", (err as Error).message);
    }
  });
  return writeChain;
}

export async function readDb(): Promise<Readonly<Database>> {
  return load();
}

/** Serialised mutation. The callback mutates the draft in place. */
export async function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await load();
  const result = await fn(db);
  await persist(db);
  return result;
}

export async function resetDb() {
  cache = createSeed();
  await persist(cache);
}
