import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get('page') ?? '1', 10);
    let pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

    if (Number.isNaN(page)) page = 1;
    if (Number.isNaN(pageSize)) pageSize = 10;

    page = clamp(page, 1, 10_000);
    pageSize = clamp(pageSize, 1, 100);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('founder_pl')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_SELECT_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return NextResponse.json({ data: data ?? [], page, pageSize, total, totalPages });
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: 'UNEXPECTED', message: e?.message ?? 'unknown' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('founder_pl').insert([body]).select().single();
    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_INSERT_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: e?.message ?? 'invalid json' } },
      { status: 400 }
    );
  }
}
