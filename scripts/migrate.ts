import { readFileSync, readdirSync } from "fs";
import path from "path";

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional when vars are already in environment
  }
}

loadEnv();

import { checkDatabaseConnection, query } from "../lib/db/postgres";

async function main() {
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`[migrate] Applying ${file}...`);
    await query(sql);
    console.log(`[migrate] ${file} applied.`);
  }

  const ok = await checkDatabaseConnection();
  console.log("[migrate] Connection check:", ok ? "OK" : "FAILED");
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
