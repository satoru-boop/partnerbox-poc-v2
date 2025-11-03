import { NextResponse } from 'next/server';

type Form = {
  title: string;
  summary: string;
  industry: string;
  phase: string;
  pl: {
    revenue: number;     // 売上
    cogs: number;        // 売上原価
    fixedCost: number;   // 固定費
    adCost: number;      // 広告費
    cv: number;          // CV数
    cvr: number;         // CVR (%)
    price: number;       // 平均単価
    cpa: number;         // CPA
    ltv: number;         // LTV
    churn: number;       // 解約率/月 (%)
  };
};

function n(x: any, d = 2) {
  return Number.isFinite(x) ? Number(Number(x).toFixed(d)) : 0;
}

export async function POST(req: Request) {
  const { form } = (await req.json()) as { form: Form };
  const p = form.pl;

  const unitCost     = p.cv > 0 ? p.cogs / p.cv : 0;
  const contribution = p.price - unitCost;
  const grossProfit  = p.revenue - p.cogs - p.adCost;
  const grossMargin  = p.revenue > 0 ? grossProfit / p.revenue : 0;

  const ltvToCac     = p.cpa > 0 ? p.ltv / p.cpa : 0;
  const paybackMonths = p.ltv > 0 ? (p.cpa / p.ltv) * 12 : 0;

  const perCVProfitAfterAds = contribution - p.cpa;
  const breakEvenCV =
    perCVProfitAfterAds > 0 ? Math.ceil(p.fixedCost / perCVProfitAfterAds) : Infinity;

  const advice: string[] = [];
  if (grossMargin < 0.2) advice.push('粗利率が20%未満です。単価見直しまたは原価/広告費削減を検討。');
  if (ltvToCac < 3)      advice.push('LTV/CAC が 3 未満です。獲得効率または継続率改善が必要です。');
  if (perCVProfitAfterAds <= 0) advice.push('1CVあたりの広告費差引後の利益がマイナスです。CPA上限を下げるか単価改善を検討。');
  if (p.churn >= 5)      advice.push('月次解約率が5%以上。オンボーディング/継続施策を強化。');
  if (advice.length === 0) advice.push('指標はおおむね健全です。スケールを検討しましょう。');

  // ざっくりスコア・要約（将来はLLMに差し替え）
  const ai_score   = Math.max(1, Math.min(100, Math.round(50 + (ltvToCac - 3) * 8 + (grossMargin - 0.2) * 60)));
  const ai_summary =
    form.summary?.trim() ||
    `業種:${form.industry} / フェーズ:${form.phase}。売上${p.revenue.toLocaleString()}・粗利率${n(grossMargin*100)}%。LTV/CAC=${n(ltvToCac)}。`;

  return NextResponse.json({
    ai_score,
    ai_summary,
    kpi: {
      grossProfit: n(grossProfit, 0),
      grossMargin: n(grossMargin * 100),
      unitCost: n(unitCost),
      contribution: n(contribution),
      ltvToCac: n(ltvToCac),
      paybackMonths: n(paybackMonths),
      perCVProfitAfterAds: n(perCVProfitAfterAds),
      breakEvenCV: Number.isFinite(breakEvenCV) ? breakEvenCV : null,
    },
    advice,
  });
}
