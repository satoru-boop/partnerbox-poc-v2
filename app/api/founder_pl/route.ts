// app/api/founder_pl/route.ts
import { NextRequest, NextResponse } from 'next/server';
// ❌ 現在: '../../../lib/supabaseAdmin'
// ✅ 正:   '../../lib/supabaseAdmin'
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export const runtime = 'nodejs';


type Row = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  ai_score: number | null;
  tags: string[] | null;
  status: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sort = (url.searchParams.get('sort') ?? 'ai_score') as 'ai_score' | 'created_at';
    const order = (url.searchParams.get('order') ?? 'desc') as 'asc' | 'desc';

    const minRevenue = num(url.searchParams.get('min_revenue'));
    const maxRevenue = num(url.searchParams.get('max_revenue'));
    const minAI = num(url.searchParams.get('min_ai'));
    const maxAI = num(url.searchParams.get('max_ai'));

    const minMargin = num(url.searchParams.get('min_margin'));
    const maxMargin = num(url.searchParams.get('max_margin'));
    const minOpeMargin = num(url.searchParams.get('min_ope_margin'));
    const maxOpeMargin = num(url.searchParams.get('max_ope_margin'));

    const tags = (url.searchParams.get('tags') ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const statuses = (url.searchParams.get('status') ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    let query = supabaseAdmin
      .from('founder_pl')
      .select(
        'id, created_at, company_name, revenue, gross_profit, operating_income, ai_score, tags, status',
        { count: 'exact' }
      );

    if (minRevenue !== null) query = query.gte('revenue', minRevenue);
    if (maxRevenue !== null) query = query.lte('revenue', maxRevenue);
    if (minAI !== null) query = query.gte('ai_score', minAI);
    if (maxAI !== null) query = query.lte('ai_score', maxAI);

    if (statuses.length) {
      query = query.in('status', statuses);
    }

    query = query.order(sort, { ascending: order === 'asc', nullsFirst: sort === 'created_at' });

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    const rows = (data ?? []).map((r: Row) => {
      const revenue = nz(r.revenue);
      const gross = nz(r.gross_profit);
      const ope = nz(r.operating_income);
      const grossMargin = revenue > 0 ? (gross / revenue) * 100 : null;
      const operatingMargin = revenue > 0 ? (ope / revenue) * 100 : null;
      return { ...r, grossMargin, operatingMargin };
    }) as (Row & { grossMargin: number | null; operatingMargin: number | null })[];

    const afterTag = tags.length
      ? rows.filter(r => (r.tags ?? []).some(t => tags.includes(t)))
      : rows;

    const afterDerived = afterTag.filter(r => {
      if (!rangeOk(r.grossMargin, minMargin, maxMargin)) return false;
      if (!rangeOk(r.operatingMargin, minOpeMargin, maxOpeMargin)) return false;
      return true;
    });

    return NextResponse.json({ count, rows: afterDerived });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'unknown error' }, { status: 500 });
  }
}

function num(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function nz(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function rangeOk(val: number | null, min: number | null, max: number | null) {
  if (val === null) return min === null && max === null ? true : false;
  if (min !== null && val < min) return false;
  if (max !== null && val > max) return false;
  return true;
}
