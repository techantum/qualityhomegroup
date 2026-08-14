import { readFileSync } from "fs";
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
  const schemaPath = path.join(process.cwd(), "supabase/migrations/001_initial_schema.sql");
  const sql = readFileSync(schemaPath, "utf8");

  console.log("[migrate] Applying schema...");
  await query(sql);
  console.log("[migrate] Schema applied successfully.");

  const ok = await checkDatabaseConnection();
  console.log("[migrate] Connection check:", ok ? "OK" : "FAILED");
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
