// app/api/founder_pl/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('founder_pl')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : 500; // not found or other
      return NextResponse.json(
        { error: { code: 'DB_SELECT_ERROR', message: error.message } },
        { status }
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
