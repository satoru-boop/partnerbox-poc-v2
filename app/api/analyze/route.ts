// app/api/analyze/route.ts
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
  return Number.isFinite(x) ? Number(x.toFixed(d)) : 0;
}

export async function POST(req: Request) {
  const { form } = (await req.json()) as { form: Form };

  const p = form.pl;
  const unitCost = p.cv > 0 ? p.cogs / p.cv : 0;              // 1CVあたりの原価ざっくり
  const contribution = p.price - unitCost;                    // 1CVあたりの粗利（広告費は別管理）
  const grossProfit = p.revenue - p.cogs - p.adCost;          // 粗利益
  const grossMargin = p.revenue > 0 ? grossProfit / p.revenue : 0;

  const ltvToCac = p.cpa > 0 ? p.ltv / p.cpa : 0;
  const paybackMonths =
    p.ltv > 0
      ? (p.cpa / p.ltv) * 12 /* 年換算のラフ目安 */ 
      : 0;

  // 固定費を回収するために必要なCV（広告費は既に支出済みという考え方）
  const perCVProfitAfterAds = contribution - p.cpa;
  const breakEvenCV =
    perCVProfitAfterAds > 0 ? Math.ceil(p.fixedCost / perCVProfitAfterAds) : Infinity;

  // ざっくりアドバイス（ルールベース）
  const advice: string[] = [];
  if (grossMargin < 0.2) advice.push('粗利率が20%未満です。単価見直しまたは原価/広告費削減を検討。');
  if (ltvToCac < 3) advice.push('LTV/CAC が 3 未満です。獲得効率または継続率改善が必要です。');
  if (perCVProfitAfterAds <= 0) advice.push('1CVあたりの広告費差引後の利益がマイナスです。CPA上限を下げるか単価改善を検討。');
  if (p.churn >= 5) advice.push('月次解約率が5%以上。オンボーディング/継続施策を強化。');
  if (advice.length === 0) advice.push('指標はおおむね健全です。スケールを検討しましょう。');

  return NextResponse.json({
    echo: form,
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
    // 将来：環境変数 OPENAI_API_KEY があれば LLM 解析に差し替える実装をここに追加できます
  });
}
