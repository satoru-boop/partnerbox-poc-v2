import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];

    if (!id || !UUID_V4.test(id)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid or missing id' } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('founder_pl')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Record not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: 'UNEXPECTED', message: e?.message ?? 'unknown' } },
      { status: 500 }
    );
  }
}
