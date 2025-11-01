// app/api/founder_pl/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 必須チェック（最低限）
    if (!body?.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('founder_pl')
      .insert({
        user_id: body.user_id ?? null,
        title: body.title ?? null,
        summary: body.summary ?? null,
        industry: body.industry ?? null,
        phase: body.phase ?? null,
        revenue: body.revenue ?? null,
        cogs: body.cogs ?? null,
        ad_cost: body.ad_cost ?? body.adCost ?? null,
        fixed_cost: body.fixed_cost ?? body.fixedCost ?? null,
        cv: body.cv ?? null,
        price: body.price ?? null,
        cvr: body.cvr ?? null,
        cpa: body.cpa ?? null,
        ltv: body.ltv ?? null,
        churn: body.churn ?? null,
        ai_score: body.ai_score ?? null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'unknown error' }, { status: 500 })
  }
}
