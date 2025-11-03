import { NextResponse } from 'next/server';

type Form = {
  title: string;
  summary: string;
  industry: string;
  phase: string;
  pl: {
    revenue: number;
    cogs: number;
    fixedCost: number;
    adCost: number;
    cv: number;
    cvr: number;
    price: number;
    cpa: number;
    ltv: number;
    churn: number;
  };
};

function n(x: any, d = 2) {
  return Number.isFinite(x) ? Number(x.toFixed(d)) : 0;
}

export async function POST(req: Request) {
  const { form } = (await req.json()) as { form: Form };

  const p = form.pl;
  const unitCost = p.cv > 0 ? p.cogs / p.cv : 0;
  const contribution = p.price - unitCost;
  const grossProfit = p.revenue - p.cogs - p.adCost;
  const grossMargin = p.revenue > 0 ? grossProfit / p.revenue : 0;

  const ltvToCac = p.cpa > 0 ? p.ltv / p.cpa : 0;
  const paybackMonths = p.ltv > 0 ? (p.cpa / p.ltv) * 12 : 0;

  const perCVProfitAfterAds = contribution - p.cpa;
  const breakEvenCV = perCVProfitAfterAds > 0 ? Math.ceil(p.fixedCost / perCVProfitAfterAds) : Infinity;

  // スコア（ラフ）
  const financeFit = Math.max(0, Math.min(100, 50 + (grossMargin - 0.3) * 120));
  const viability = Math.max(0, Math.min(100, 50 + (ltvToCac - 3) * 20));
  const goToMarket = Math.max(0, Math.min(100, 50 + (p.cvr - 2) * 8));
  const risk = Math.max(0, Math.min(100, 100 - p.churn * 5));
  const score = Math.round(0.35 * financeFit + 0.35 * viability + 0.2 * goToMarket + 0.1 * risk);
  const rank = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';

  const advice: string[] = [];
  if (grossMargin < 0.2) advice.push('粗利率が20%未満。原価または広告費の見直しを検討。');
  if (ltvToCac < 3) advice.push('LTV/CACが3未満。獲得効率または継続率の改善が必要。');
  if (perCVProfitAfterAds <= 0) advice.push('広告費差引後の1CV利益がマイナス。CPA上限の引き下げや単価改善を検討。');
  if (p.churn >= 5) advice.push('月次解約率5%以上。オンボーディング/継続施策を強化。');
  if (advice.length === 0) advice.push('指標は概ね健全。スケールを検討しましょう。');

  const strengths: string[] = [];
  if (grossMargin >= 0.4) strengths.push('高い粗利率でコスト構造が健全。');
  if (ltvToCac >= 4) strengths.push('LTV/CACが高く、獲得効率が良好。');

  const risks: string[] = [];
  if (grossMargin < 0.2) risks.push('粗利率が低い。売価・原価・広告費の再設計が必要。');
  if (p.churn >= 5) risks.push('解約率が高い。プロダクト/サポートの改善が必要。');

  const improvements: string[] = [
    'LTV向上（継続率・単価）またはCAC削減（CVR改善）に注力。',
    'CV・単価・売上の定義を見直し、真実を統一。',
  ];

  const sanity: string[] = [
    `売上: ${n(p.revenue, 0)} / 損益分岐CV: ${Number.isFinite(breakEvenCV) ? breakEvenCV : '—'} / 粗利率: ${n(grossMargin * 100)}%`,
    `粗利率: ${n(grossMargin * 100)}% / 広告費率: ${p.revenue ? n((p.adCost / p.revenue) * 100) : 0}% / 経営健全性: ${n(100 - (p.cogs + p.adCost + p.fixedCost) / (p.revenue || 1) * 100)}%`,
    `LTV/CAC: ${n(ltvToCac)} / 回収率(月): ${n(paybackMonths)} / 解約率(月): ${n(p.churn)}%`,
  ];

  return NextResponse.json({
    score,
    rank,
    subscores: { financeFit, viability, goToMarket, risk },
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
    strengths,
    risks,
    improvements,
    sanity,
  });
}
