// app/api/analyze/route.ts
import { NextResponse } from 'next/server';

type Form = {
  title: string;
  summary?: string;
  industry: string;
  phase: string;
  pl: {
    revenue: number;
    cogs: number;
    fixedCost: number;
    adCost: number;
    cv: number;
    cvr: number;   // %
    price: number;
    cpa: number;
    ltv: number;
    churn: number; // % / month
  };
};

const n = (x: any, d = 2) => (Number.isFinite(x) ? Number(Number(x).toFixed(d)) : 0);
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function rank(score: number) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

export async function POST(req: Request) {
  try {
    const { form } = (await req.json()) as { form: Form };
    const p = form.pl;

    // 基本KPI
    const grossProfit = (p.revenue ?? 0) - (p.cogs ?? 0) - (p.adCost ?? 0);
    const grossMargin = (p.revenue ?? 0) > 0 ? grossProfit / p.revenue : 0;       // 0-1
    const ltvToCac   = (p.cpa ?? 0) > 0 ? (p.ltv ?? 0) / p.cpa : 0;
    const paybackM   = (p.ltv ?? 0) > 0 ? ((p.cpa ?? 0) / (p.ltv ?? 1)) * 12 : 0; // 目安
    const unitCost   = (p.cv ?? 0) > 0 ? (p.cogs ?? 0) / p.cv : 0;
    const contribution = (p.price ?? 0) - unitCost;
    const perCVProfitAfterAds = contribution - (p.cpa ?? 0);
    const breakEvenCV =
      perCVProfitAfterAds > 0 ? Math.ceil((p.fixedCost ?? 0) / perCVProfitAfterAds) : Infinity;

    // --- サブスコア（0-100, 高いほど良い） ---
    // Finance Fit：粗利率・LTV/CAC・Payback から総合
    const sGross = clamp((grossMargin - 0.2) * 250 + 50);          // 粗利率20%で50点、60%で150→100に丸め
    const sLtvCac = clamp(ltvToCac * 25);                          // LTV/CAC=4で100点
    const sPayback = clamp(100 - paybackM * 6);                    // 〜6ヶ月=約64点、短いほど高評価
    const financeFit = Math.round((sGross * 0.45 + sLtvCac * 0.4 + sPayback * 0.15));

    // Viability：固定費回収可能性（損益分岐CV）と広告差引後1CV利益
    const sCvBep = clamp(Number.isFinite(breakEvenCV) ? 100 - Math.log10(breakEvenCV + 1) * 20 : 10);
    const sPerCv = clamp(50 + (perCVProfitAfterAds / Math.max(1, p.price)) * 200); // 単価比で強め
    const viability = Math.round((sCvBep * 0.5 + sPerCv * 0.5));

    // Go-To-Market：CVRと平均単価×CVからざっくり
    const revenuePerCv = (p.price ?? 0);
    const sCvr = clamp((p.cvr ?? 0) * 4);                          // CVR 25%で100
    const sRvc = clamp(Math.log10(revenuePerCv + 1) * 18);         // 桁で評価
    const goToMarket = Math.round((sCvr * 0.6 + sRvc * 0.4));

    // Risk：解約率低い・広告依存低い・粗利率高いほど高評価（低リスク）
    const sChurn = clamp(100 - (p.churn ?? 0) * 8);                // 0%:100, 5%:60, 10%:20
    const adRatio = (p.revenue ?? 0) > 0 ? (p.adCost ?? 0) / p.revenue : 0;
    const sAd = clamp(100 - adRatio * 150);                        // 広告依存高いと減点
    const sRiskGross = clamp((grossMargin - 0.25) * 220 + 50);
    const risk = Math.round((sChurn * 0.5 + sAd * 0.2 + sRiskGross * 0.3));

    // 総合スコア（重み）
    const total = Math.round(financeFit * 0.45 + viability * 0.25 + goToMarket * 0.15 + risk * 0.15);

    // コメント群
    const strengths: string[] = [];
    const risks: string[] = [];
    const improvements: string[] = [];
    if (grossMargin >= 0.5) strengths.push('粗利率が高くコスト構造が良好です。');
    if (ltvToCac >= 3) strengths.push('LTV/CAC が 3 以上で投資効率が良好です。');
    if (perCVProfitAfterAds > 0) strengths.push('広告費差引後も1CV利益がプラスです。');

    if (grossMargin < 0.2) risks.push('粗利率が20%未満。原価/広告費の見直しが必要です。');
    if (ltvToCac < 2) risks.push('LTV/CAC が低く、獲得効率に課題があります。');
    if (p.churn >= 5) risks.push('月次解約率が高い傾向です。');

    if (ltvToCac < 3) improvements.push('LTV向上（継続率・単価）またはCAC削減（CVR改善）に注力。');
    if (perCVProfitAfterAds <= 0) improvements.push('CV単価・広告費・売上構成の定義を見直し、真実を統一。');
    if ((p.revenue ?? 0) > 0 && adRatio > 0.3) improvements.push('広告依存度を低減し既存顧客売上を拡大。');

    const sanity: string[] = [
      `売上: ${n(p.revenue,0).toLocaleString()} / 損益分岐CV: ${Number.isFinite(breakEvenCV) ? breakEvenCV : '—'} / 粗利率: ${n(grossMargin*100)}%`,
      `粗利率: ${n(((p.revenue - p.cogs) / Math.max(1,p.revenue))*100)}% / 広告費率: ${n(adRatio*100)}% / 経営健全性: ${n((grossMargin - adRatio)*100)}%`,
      `LTV/CAC: ${n(ltvToCac)} / Payback(月): ${n(paybackM)} / 解約率: ${n(p.churn)}%`,
    ];

    return NextResponse.json({
      score: total,
      rank: rank(total),
      subscores: {
        financeFit,
        viability,
        goToMarket,
        risk,
      },
      kpi: {
        grossProfit: n(grossProfit, 0),
        grossMargin: n(grossMargin * 100),
        unitCost: n(unitCost),
        contribution: n(contribution),
        ltvToCac: n(ltvToCac),
        paybackMonths: n(paybackM),
        perCVProfitAfterAds: n(perCVProfitAfterAds),
        breakEvenCV: Number.isFinite(breakEvenCV) ? breakEvenCV : null,
      },
      strengths,
      risks,
      improvements,
      sanity,
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message ?? 'Bad Request' } }, { status: 400 });
  }
}
