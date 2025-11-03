// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function pickIdFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    // /api/fpl/:id/publish を想定
    const seg = u.pathname.split('/').filter(Boolean);
    // ["api","fpl",":id","publish"] → id は index 2
    return seg.length >= 4 ? seg[2] : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    const id: string | null =
      ctx?.params?.id ?? pickIdFromUrl(req.url);

    if (!id) {
      return NextResponse.json(
        { error: { message: 'id is required' } },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('founder_pl')
      .update({
        status: 'review',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id,status,submitted_at')
      .single();

    if (error) throw error;

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
