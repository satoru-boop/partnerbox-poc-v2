'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type AnalyzeKPI = {
  grossProfit: number;
  grossMargin: number;          // %
  unitCost: number;
  contribution: number;
  ltvToCac: number;
  paybackMonths: number;
  perCVProfitAfterAds: number;
  breakEvenCV: number | null;
};

export default function FormClient() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [kpi, setKpi] = React.useState<AnalyzeKPI | null>(null);
  const [advice, setAdvice] = React.useState<string[] | null>(null);

  const onAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnalyzing(true);
    setMsg(null);
    setKpi(null);
    setAdvice(null);

    try {
      const fd = new FormData(e.currentTarget);
      const pick = (k: string, asNum = false) => {
        const v = fd.get(k);
        if (v == null) return asNum ? 0 : '';
        const s = String(v).trim();
        if (s === '') return asNum ? 0 : '';
        return asNum ? Number(s) : s;
      };

      const form = {
        title: pick('title'),
        summary: pick('summary'),
        industry: pick('industry'),
        phase: pick('phase'),
        pl: {
          revenue:    pick('revenue', true),
          cogs:       pick('cogs', true),
          fixedCost:  pick('fixed_cost', true),
          adCost:     pick('ad_cost', true),
          cv:         pick('cv', true),
          cvr:        pick('cvr', true),
          price:      pick('price', true),
          cpa:        pick('cpa', true),
          ltv:        pick('ltv', true),
          churn:      pick('churn', true),
        },
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error ?? `status ${res.status}`);

      // 解析結果のUI反映（空の場合は補完値で上書き）
      const aiScore = json?.ai_score ?? null;
      const aiSummary = json?.ai_summary ?? null;

      const scoreEl = (e.currentTarget.elements.namedItem('ai_score') as HTMLInputElement | null);
      const summaryEl = (e.currentTarget.elements.namedItem('summary') as HTMLTextAreaElement | null);

      if (scoreEl && (scoreEl.value === '' || Number(scoreEl.value) === 0) && aiScore != null) {
        scoreEl.value = String(aiScore);
      }
      if (summaryEl && (summaryEl.value.trim() === '') && aiSummary) {
        summaryEl.value = aiSummary;
      }

      setKpi(json?.kpi ?? null);
      setAdvice(json?.advice ?? null);
      setMsg('AI解析が完了しました。内容を確認して保存してください。');
    } catch (err: any) {
      setMsg(`AI解析エラー: ${err?.message ?? String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      const pick = (keys: string[], asNum = false) => {
        for (const k of keys) {
          const v = fd.get(k);
          if (v != null && String(v).trim() !== '') {
            return asNum ? Number(v) : String(v);
          }
        }
        return asNum ? null : null;
      };

      const payload = {
        title:        pick(['title','project_title','案件名','subject']),
        company_name: pick(['company_name','company','会社名']),
        industry:     pick(['industry','業種']),
        phase:        pick(['phase','stage','フェーズ']),
        revenue:      pick(['revenue','売上','売上高'], true),
        ai_score:     pick(['ai_score','score','AIスコア'], true),
        summary:      pick(['summary','要約','概要','memo']),
        tags:         pick(['tags','tag','タグ']) ?? '',

        // KPI（DBのカラム名と一致させる）
        cogs:        pick(['cogs'], true),
        fixed_cost:  pick(['fixed_cost'], true),
        ad_cost:     pick(['ad_cost'], true),
        cv:          pick(['cv'], true),
        cvr:         pick(['cvr'], true),
        price:       pick(['price'], true),
        cpa:         pick(['cpa'], true),
        ltv:         pick(['ltv'], true),
        churn:       pick(['churn'], true),
      };

      const res = await fetch('/api/fpl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
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
  };

  return (
    <form onSubmit={onAnalyze} className="rounded-2xl border p-5 space-y-4">
      {/* 上段：基本項目 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">案件名（title）</span>
          <input name="title" placeholder="例）ヘルスケアSaaS A" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">会社名（company_name）</span>
          <input name="company_name" placeholder="例）株式会社○○" className="w-full rounded border px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">業種（industry）</span>
          <input name="industry" placeholder="例）SaaS / 医療" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">フェーズ（phase）</span>
          <input name="phase" placeholder="例）Seed / Series A" className="w-full rounded border px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">売上（revenue）</span>
          <input name="revenue" type="number" inputMode="numeric" placeholder="例）1200000" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">AIスコア（ai_score）</span>
          <input name="ai_score" type="number" inputMode="numeric" placeholder="例）65" className="w-full rounded border px-3 py-2" />
        </label>

        <label className="col-span-full text-sm">
          <span className="block text-gray-600 mb-1">概要（summary）</span>
          <textarea name="summary" placeholder="事業概要や補足事項を記入" className="w-full rounded border px-3 py-2 h-28" />
        </label>
      </div>

      {/* 中段：詳細KPI */}
      <fieldset className="col-span-full rounded-xl border p-4 space-y-3">
        <legend className="px-1 text-sm font-medium text-gray-700">詳細KPI（任意）</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-sm"><span className="block text-gray-600 mb-1">売上原価（cogs）</span><input name="cogs" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">固定費（fixed_cost）</span><input name="fixed_cost" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">広告費（ad_cost）</span><input name="ad_cost" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>

          <label className="text-sm"><span className="block text-gray-600 mb-1">CV数（cv）</span><input name="cv" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">CVR%（cvr）</span><input name="cvr" type="number" inputMode="numeric" step="0.01" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">平均単価（price）</span><input name="price" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>

          <label className="text-sm"><span className="block text-gray-600 mb-1">CPA（cpa）</span><input name="cpa" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">LTV（ltv）</span><input name="ltv" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" /></label>
          <label className="text-sm"><span className="block text-gray-600 mb-1">解約率%／月（churn）</span><input name="churn" type="number" inputMode="numeric" step="0.01" className="w-full rounded border px-3 py-2" /></label>
        </div>
      </fieldset>

      {/* 下段：タグ＆ボタン */}
      <div className="grid grid-cols-1 gap-4">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">タグ（tags｜カンマ区切り可）</span>
          <input name="tags" placeholder="例）SaaS, 医療, D2C" className="w-full rounded border px-3 py-2" />
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={analyzing} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {analyzing ? 'AI解析中…' : 'AI解析する'}
        </button>
        <button
          type="button"
          onClick={(ev) => onSave(ev as unknown as React.FormEvent<HTMLFormElement>)}
          disabled={saving}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存して投資家プレビューへ'}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}

      {/* 解析KPIプレビュー */}
      {kpi && (
        <div className="rounded-xl border p-4 text-sm space-y-2 bg-white/40">
          <div className="font-medium mb-1">AI解析サマリー</div>
          <ul className="grid grid-cols-2 gap-x-6">
            <li>粗利益: <b>{kpi.grossProfit.toLocaleString()}</b></li>
            <li>粗利率: <b>{kpi.grossMargin}%</b></li>
            <li>単位原価: <b>{kpi.unitCost}</b></li>
            <li>単位粗利: <b>{kpi.contribution}</b></li>
            <li>LTV/CAC: <b>{kpi.ltvToCac}</b></li>
            <li>回収目安(月): <b>{kpi.paybackMonths}</b></li>
            <li>広告差引後/件: <b>{kpi.perCVProfitAfterAds}</b></li>
            <li>損益分岐CV: <b>{kpi.breakEvenCV ?? '-'}</b></li>
          </ul>
          {advice && advice.length > 0 && (
            <div className="pt-2">
              <div className="text-gray-600">アドバイス</div>
              <ul className="list-disc ml-5">
                {advice.map((a, i) => (<li key={i}>{a}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
