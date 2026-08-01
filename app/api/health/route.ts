/**
 * GET /api/health → liveness + DB readiness probe for orchestrators / uptime
 * monitors. Returns 200 when the app can reach the database, 503 otherwise.
 */
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`); // cheap round-trip to confirm the DB answers
    return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'degraded' }, { status: 503 });
  }
}
