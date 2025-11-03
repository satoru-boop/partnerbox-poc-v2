// app/api/fpl/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Next.js 16 では context.params は Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allow = [
    'title','company_name','industry','phase','revenue','ai_score','summary',
    'gross_profit','operating_income','cogs','ad_cost','fixed_cost','cv',
    'price','cvr','cpa','ltv','churn','tags'
  ] as const;

  const payload: Record<string, any> = {};
  for (const k of allow) if (k in body) payload[k] = body[k];
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: { message: 'no updatable fields' } }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
