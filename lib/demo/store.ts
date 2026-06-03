import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createSeedStore } from "@/lib/demo/seed-data";
import type { AppStore } from "@/types/domain";

const storePath = join(process.cwd(), ".local-demo", "rru-aid-os.json");

async function writeStore(store: AppStore) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function readDemoStore(): Promise<AppStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as AppStore;
  } catch {
    const seeded = createSeedStore();
    await writeStore(seeded);
    return seeded;
  }
}

export async function mutateDemoStore<T>(mutator: (store: AppStore) => T | Promise<T>) {
  const store = await readDemoStore();
  const result = await mutator(store);
  await writeStore(store);
  return result;
}

export async function resetDemoStore() {
  const seeded = createSeedStore();
  await writeStore(seeded);
  return seeded;
}
