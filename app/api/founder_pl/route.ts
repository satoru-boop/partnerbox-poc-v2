// /app/api/founder_pl/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

// ========================
//  GET: 一覧取得
// ========================
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.enum(['ai_score', 'created_at']).default('ai_score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  aiMin: z.coerce.number().optional(),
  aiMax: z.coerce.number().optional(),
  revMin: z.coerce.number().optional(),
  revMax: z.coerce.number().optional(),
  tags: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parse = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { page, pageSize, sort, order, aiMin, aiMax, revMin, revMax, tags } = parse.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createClient();
  let q = supabase.from('founder_pl').select('*', { count: 'exact' });

  if (aiMin != null) q = q.gte('ai_score', aiMin);
  if (aiMax != null) q = q.lte('ai_score', aiMax);
  if (revMin != null) q = q.gte('revenue', revMin);
  if (revMax != null) q = q.lte('revenue', revMax);

  if (tags) {
    const arr = tags.split(',').map((s) => s.trim()).filter(Boolean);
    if (arr.length) {
      const ors = arr.map((t) => `tags.cs.{${t}}`).join(',');
      q = q.or(ors);
    }
  }

  q = q.order(sort, { ascending: order === 'asc' }).range(from, to);
  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
    sort,
    order,
  });
}

// ========================
//  POST: 登録処理
// ========================
export async function POST(req: Request) {
  // 1) JSON受け取り
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 2) カラム変換
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4) JSONを必ず返す
  return NextResponse.json({ ok: true, id: data?.id ?? null }, { status: 200 });
}
