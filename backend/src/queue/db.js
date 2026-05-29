import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/index.js";

async function ensureDbFile() {
  await fs.mkdir(path.dirname(config.dbPath), { recursive: true });
  try {
    const content = await fs.readFile(config.dbPath, "utf8");
    return content.trim() ? JSON.parse(content) : { jobs: [] };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const initial = { jobs: [] };
    await fs.writeFile(config.dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
}

export async function readDb() {
  const db = await ensureDbFile();
  return { jobs: Array.isArray(db.jobs) ? db.jobs : [] };
}

export async function writeDb(db) {
  await fs.mkdir(path.dirname(config.dbPath), { recursive: true });
  await fs.writeFile(config.dbPath, JSON.stringify(db, null, 2));
}
