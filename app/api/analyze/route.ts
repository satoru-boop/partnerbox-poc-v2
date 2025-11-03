// app/api/analyze/route.ts
import { NextResponse } from 'next/server';

type Form = {
  title: string;
  summary: string;
  industry: string;
  phase: string;
  pl: {
    revenue: number;    // 売上
    cogs: number;       // 売上原価
    fixedCost: number;  // 固定費
    adCost: number;     // 広告費
    cv: number;         // CV数
    cvr: number;        // CVR (%)
    price: number;      // 平均単価
    cpa: number;        // CPA
    ltv: number;        // LTV
    churn: number;      // 解約率/月 (%)
  };
};

const n = (x: any, d = 2) => (Number.isFinite(x) ? Number(Number(x).toFixed(d)) : 0);

export async function POST(req: Request) {
  try {
    const { form } = (await req.json()) as { form: Form };
    const p = form.pl;

    const unitCost = p.cv > 0 ? p.cogs / p.cv : 0;              // 1CVあたりの原価
    const contribution = p.price - unitCost;                    // 1CVあたりの粗利（広告費は別）
    const grossProfit = (p.revenue ?? 0) - (p.cogs ?? 0) - (p.adCost ?? 0);
    const grossMargin = (p.revenue ?? 0) > 0 ? grossProfit / p.revenue : 0;

    const ltvToCac = (p.cpa ?? 0) > 0 ? (p.ltv ?? 0) / p.cpa : 0;
    const paybackMonths = (p.ltv ?? 0) > 0 ? ((p.cpa ?? 0) / (p.ltv ?? 1)) * 12 : 0;

    const perCVProfitAfterAds = contribution - (p.cpa ?? 0);
    const breakEvenCV =
      perCVProfitAfterAds > 0 ? Math.ceil((p.fixedCost ?? 0) / perCVProfitAfterAds) : Infinity;

    // ざっくりルール
    const advice: string[] = [];
    if (grossMargin < 0.2) advice.push('粗利率が20%未満です。単価見直しまたは原価/広告費削減を検討。');
    if (ltvToCac < 3) advice.push('LTV/CAC が 3 未満です。獲得効率または継続率改善が必要です。');
    if (perCVProfitAfterAds <= 0) advice.push('広告費差引後の1CV利益がマイナス。CPA上限引下げや単価改善を検討。');
    if ((p.churn ?? 0) >= 5) advice.push('月次解約率が5%以上。オンボーディング/継続施策を強化。');
    if (advice.length === 0) advice.push('指標はおおむね健全です。スケールを検討しましょう。');

    // スコア（簡易）
    let score = 70;
    score += Math.min(20, Math.max(-20, (ltvToCac - 3) * 5));
    score += Math.min(10, Math.max(-10, (grossMargin - 0.3) * 50));
    score = Math.round(Math.max(0, Math.min(100, score)));

    return NextResponse.json({
      echo: form,
      kpi: {
        grossProfit: n(grossProfit, 0),
        grossMargin: n(grossMargin * 100), // %
        unitCost: n(unitCost),
        contribution: n(contribution),
        ltvToCac: n(ltvToCac),
        paybackMonths: n(paybackMonths),
        perCVProfitAfterAds: n(perCVProfitAfterAds),
        breakEvenCV: Number.isFinite(breakEvenCV) ? breakEvenCV : null,
      },
      advice,
      score,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message ?? 'Bad Request' } },
      { status: 400 },
    );
  }
}
