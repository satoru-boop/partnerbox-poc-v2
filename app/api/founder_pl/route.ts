// /app/api/founder/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 互換: /api/founder にPOSTされたフォームを founder_pl に保存してJSONを返す
export async function POST(req: Request) {
  // 1) JSON受け取り（空・壊れたJSON対策）
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // 2) 型整形
  const toNum = (v: any) =>
    v === null || v === undefined || v === '' ? null : Number(v);

  const tags =
    Array.isArray(body?.tags)
      ? body.tags
      : typeof body?.tags === 'string'
      ? body.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : null;

  const row = {
    company_name: body?.company_name ?? null,
    ai_score: toNum(body?.ai_score),
    revenue: toNum(body?.revenue),
    gross_profit: toNum(body?.gross_profit),
    operating_income: toNum(body?.operating_income),
    tags,
  };

  // 3) 登録
  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 4) 必ずJSONを返す
  return NextResponse.json({ ok: true, id: data?.id ?? null }, { status: 200 });
}

// 任意: フロントが誤ってGETしてもJSONで返す
export async function GET() {
  return NextResponse.json({ ok: true, message: 'POST to /api/founder to submit.' }, { status: 200 });
}
