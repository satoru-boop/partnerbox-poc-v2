// /app/api/founder_pl/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../lib/supabaseAdmin'; // ← ここがポイント

export const runtime = 'nodejs';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.enum(['ai_score', 'created_at']).default('ai_score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  aiMin: z.coerce.number().optional(),
  aiMax: z.coerce.number().optional(),
  revMin: z.coerce.number().optional(),
  revMax: z.coerce.number().optional(),
  tags: z.string().optional(), // カンマ区切り "B2B,Fintech"
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parse = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parse.error.flatten() }, { status: 400 });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
