// /app/api/founder_pl/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string() });

export async function GET(_req: Request, ctx: any) {
  const params = ctx?.params ?? {};

  // ✅ /api/founder_pl/ping で来た場合は疎通OKを返す（動的ルートに入ってもOK）
  if (params?.id === 'ping') {
    return NextResponse.json({ ok: true, via: '/api/founder_pl/[id]', note: 'ping passthrough' });
  }

  // 通常のIDチェック（UUIDでなくてもまずは文字列として許容）
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .select('*')
    .eq('id', parsed.data.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}
