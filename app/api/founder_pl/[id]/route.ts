// app/api/founder_pl/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const { data, error } = await supabase
      .from('founder_pl')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Supabaseのnot foundはnull/エラーのどちらでもあり得るため保険をかける
      const isNotFound =
        (error as any)?.code === 'PGRST116' ||
        (error as any)?.details?.includes('Results contain 0 rows') ||
        !data;

      return NextResponse.json(
        { error: { code: isNotFound ? 'NOT_FOUND' : 'DB_SELECT_ERROR', message: error.message } },
        { status: isNotFound ? 404 : 500 }
      );
    }

    if (!data) {
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
