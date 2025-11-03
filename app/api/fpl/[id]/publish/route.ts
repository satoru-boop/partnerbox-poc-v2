// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = createClient();

    // 存在チェック
    const { data: found, error: getErr } = await supabase
      .from('founder_pl')
      .select('id,status')
      .eq('id', id)
      .single();
    if (getErr || !found) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // 下書き→審査中 へ
    const { data, error } = await supabase
      .from('founder_pl')
      .update({
        status: 'review',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id,status,submitted_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'publish_failed' },
      { status: 500 }
    );
  }
}
