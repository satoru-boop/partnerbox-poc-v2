import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/founder_pl/ping',
    ts: new Date().toISOString(),
  });
}
