import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

function getConnectionString(): string {
  return (
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    ""
  );
}

export function getPool(): Pool {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not set");
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
      ssl: connectionString.includes("supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    globalForPg.pgPool.on("error", (err) => {
      console.error("[postgres] Unexpected pool error:", err);
    });
  }

  return globalForPg.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("[postgres] Connection failed:", error);
    return false;
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getConnectionString());
}
