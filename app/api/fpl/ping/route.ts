import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/fpl/ping', ts: new Date().toISOString() });
}
