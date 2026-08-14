/**
 * GET /api/v1/health/db - Verify Postgres/Supabase database connectivity.
 */

import { NextResponse } from "next/server";
import { isAdminConfigured, isAdminConnected } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isAdminConfigured();
  const connected = configured ? await isAdminConnected() : false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  const ok = configured && connected;

  return NextResponse.json(
    {
      ok,
      supabase: {
        url: supabaseUrl,
        configured: Boolean(supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      },
      database: {
        configured,
        connected,
      },
      message: ok
        ? "Supabase Postgres is configured and reachable."
        : !configured
          ? "DATABASE_URL or DIRECT_URL is not set in .env."
          : "Database connection failed. Check DATABASE_URL credentials and restart.",
    },
    { status: ok ? 200 : 503 },
  );
}
