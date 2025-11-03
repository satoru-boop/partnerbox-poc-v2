// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json(
        { error: { message: 'Missing id' } },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('founder_pl')
      .update({
        status: 'review',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, submitted_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '公開申請を受け付けました（審査中に移行）',
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e?.message ?? String(e) } },
      { status: 500 }
    );
  }
}
