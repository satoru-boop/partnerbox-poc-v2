'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type FormState = {
  title: string;
  company_name: string;
  industry: string;
  phase: string;
  revenue: string;   // 入力は文字列で持ち、送信時に数値化
  summary: string;

  // 詳細KPI（任意）
  cogs: string;
  fixed_cost: string;
  ad_cost: string;
  cv: string;
  cvr: string;
  price: string;
  cpa: string;
  ltv: string;
  churn: string;
};

type Analysis = {
  score: number;
  advice: string[];
  kpi: {
    grossProfit: number;
    grossMargin: number;
    unitCost: number;
    contribution: number;
    ltvToCac: number;
    paybackMonths: number;
    perCVProfitAfterAds: number;
    breakEvenCV: number | null;
  };
  summary?: string;
};

const INDUSTRY_OPTIONS = [
  'SaaS', '医療', '小売', '製造', 'マーケティング', '教育', 'Fintech', 'その他',
];

const PHASE_OPTIONS = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B+', 'PMF以降', 'その他',
];

export default function FormClient() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>({
    title: '',
    company_name: '',
    industry: '',
    phase: '',
    revenue: '',
    summary: '',

    cogs: '',
    fixed_cost: '',
    ad_cost: '',
    cv: '',
    cvr: '',
    price: '',
    cpa: '',
    ltv: '',
    churn: '',
  });

  const [analyzing, setAnalyzing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);

  const onChange =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const n = (v: string) => (v === '' ? null : Number(v));

  async function onAnalyze() {
    setAnalyzing(true);
    setMsg(null);
    setAnalysis(null);
    try {
      const payload = {
        form: {
          title: form.title,
          summary: form.summary,
          industry: form.industry,
          phase: form.phase,
          pl: {
            revenue: n(form.revenue) ?? 0,
            cogs: n(form.cogs) ?? 0,
            fixedCost: n(form.fixed_cost) ?? 0,
            adCost: n(form.ad_cost) ?? 0,
            cv: n(form.cv) ?? 0,
            cvr: n(form.cvr) ?? 0,
            price: n(form.price) ?? 0,
            cpa: n(form.cpa) ?? 0,
            ltv: n(form.ltv) ?? 0,
            churn: n(form.churn) ?? 0,
          },
        },
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);

      const aiSummary =
        json?.echo?.summary && String(json.echo.summary).trim().length > 0
          ? String(json.echo.summary)
          : form.summary;

      setAnalysis({
        score: json?.score ?? json?.kpi ? Math.min(100, Math.max(0, Math.round((json.kpi.ltvToCac ?? 0) * 25))) : 0,
        advice: json?.advice ?? [],
        kpi: json?.kpi,
        summary: aiSummary,
      });

      // 解析結果の要約があればフォームに反映（ユーザー編集可）
      if (aiSummary && aiSummary !== form.summary) {
        setForm((s) => ({ ...s, summary: aiSummary }));
      }
    } catch (err: any) {
      setMsg(`AI解析エラー: ${err?.message ?? String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/fpl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: form.title || null,
          company_name: form.company_name || null,
          industry: form.industry || null,
          phase: form.phase || null,
          revenue: n(form.revenue),
          summary: form.summary || null,

          cogs: n(form.cogs),
          fixed_cost: n(form.fixed_cost),
          ad_cost: n(form.ad_cost),
          cv: n(form.cv),
          cvr: n(form.cvr),
          price: n(form.price),
          cpa: n(form.cpa),
          ltv: n(form.ltv),
          churn: n(form.churn),

          // 入力欄は出さないが、AIが出したスコアは保存（なければ null）
          ai_score: analysis?.score ?? null,

          // 仕様：タグは今は不要
          tags: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);
      const id = json?.data?.id as string;
      router.push(`/investors/${id}`);
    } catch (err: any) {
      setMsg(`保存エラー: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border p-5 space-y-6">
      {/* 上段（基本情報） */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">案件名（title）</span>
          <input className="w-full rounded border px-3 py-2" value={form.title} onChange={onChange('title')}
                 placeholder="例）ヘルスケアSaaS A" />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">会社名（company_name）</span>
          <input className="w-full rounded border px-3 py-2" value={form.company_name} onChange={onChange('company_name')}
                 placeholder="例）株式会社○○" />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">業種（industry）</span>
          <select className="w-full rounded border px-3 py-2" value={form.industry} onChange={onChange('industry')}>
            <option value="">選択してください</option>
            {INDUSTRY_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">フェーズ（phase）</span>
          <select className="w-full rounded border px-3 py-2" value={form.phase} onChange={onChange('phase')}>
            <option value="">選択してください</option>
            {PHASE_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">売上（revenue）</span>
          <input className="w-full rounded border px-3 py-2" type="number" inputMode="numeric"
                 value={form.revenue} onChange={onChange('revenue')} placeholder="例）1200000" />
        </label>

        {/* AIスコアは入力欄を出さない（仕様） */}
      </div>

      {/* 概要 */}
      <label className="text-sm block">
        <span className="block text-gray-600 mb-1">概要（summary）</span>
        <textarea className="w-full rounded border px-3 py-2 h-28"
                  value={form.summary} onChange={onChange('summary')}
                  placeholder="事業概要や補足事項を記入" />
      </label>

      {/* 詳細KPI（任意） */}
      <fieldset className="rounded-xl border p-4">
        <legend className="px-1 text-sm text-gray-600">詳細KPI（任意）</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InputNum label="売上原価（cogs）" val={form.cogs} onChange={onChange('cogs')} />
          <InputNum label="固定費（fixed_cost）" val={form.fixed_cost} onChange={onChange('fixed_cost')} />
          <InputNum label="広告費（ad_cost）" val={form.ad_cost} onChange={onChange('ad_cost')} />

          <InputNum label="CV数（cv）" val={form.cv} onChange={onChange('cv')} />
          <InputNum label="CVR%（cvr）" val={form.cvr} onChange={onChange('cvr')} />
          <InputNum label="平均単価（price）" val={form.price} onChange={onChange('price')} />

          <InputNum label="CPA（cpa）" val={form.cpa} onChange={onChange('cpa')} />
          <InputNum label="LTV（ltv）" val={form.ltv} onChange={onChange('ltv')} />
          <InputNum label="解約率%/月（churn）" val={form.churn} onChange={onChange('churn')} />
        </div>
      </fieldset>

      {/* ボタン群 */}
      <div className="flex gap-3">
        <button type="button" onClick={onAnalyze} disabled={analyzing}
                className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {analyzing ? 'AI解析中…' : 'AI解析する'}
        </button>

        <button type="button" onClick={onSave} disabled={saving}
                className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {saving ? '保存中…' : '保存して投資家プレビューへ'}
        </button>
      </div>

      {/* 解析結果の表示（読み取り専用） */}
      {analysis && (
        <section className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">AIスコア</span>
            <span className="rounded-md border px-2 py-0.5 text-sm font-medium">{analysis.score}</span>
          </div>

          <div>
            <h3 className="font-medium mb-1">KPI</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-sm">
              <li>粗利益: {analysis.kpi.grossProfit}</li>
              <li>粗利率%: {analysis.kpi.grossMargin}</li>
              <li>1CV原価ざっくり: {analysis.kpi.unitCost}</li>
              <li>1CV粗利: {analysis.kpi.contribution}</li>
              <li>LTV/CAC: {analysis.kpi.ltvToCac}</li>
              <li>Payback（月換算目安）: {analysis.kpi.paybackMonths}</li>
              <li>広告差引後1CV利益: {analysis.kpi.perCVProfitAfterAds}</li>
              <li>損益分岐CV: {analysis.kpi.breakEvenCV ?? '-'}</li>
            </ul>
          </div>

          {analysis.advice?.length > 0 && (
            <div>
              <h3 className="font-medium mb-1">アドバイス</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {analysis.advice.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}

function InputNum({
  label,
  val,
  onChange,
}: {
  label: string;
  val: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="number" inputMode="numeric"
             className="w-full rounded border px-3 py-2"
             value={val} onChange={onChange} />
    </label>
  );
}
