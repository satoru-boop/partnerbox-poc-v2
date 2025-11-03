'use client';

import * as React from 'react';
import { useState } from 'react';

type FormState = {
  // 事業の基本情報
  company_name: string;
  title: string;
  industry: string;
  phase: string;
  summary: string;

  // PL・KPI（簡易）
  revenue: string;     // number文字列
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
  score: number; // AIスコア（ダミー or /api/analyzeから推定）
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
  strengths: string[];
  risks: string[];
  improvements: string[];
  checks: string[];
};

const industryOptions = [
  '', 'SaaS', '医療', 'Fintech', 'D2C', 'マーケットプレイス', '教育', 'その他',
];

const phaseOptions = [
  '', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'PMF済み', 'その他',
];

// 数値に丸める補助
function n(v: string): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

export default function Page() {
  const [form, setForm] = useState<FormState>({
    company_name: '',
    title: '',
    industry: '',
    phase: '',
    summary: '',
    revenue: '',
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

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onChange =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  // ---- AI解析（/api/analyze を呼ぶ） ----
  async function analyze() {
    try {
      setSaving(true);
      setMsg(null);

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

      if (!res.ok) throw new Error(json?.error ?? `status ${res.status}`);

      // 返却仕様（長い版）を想定
      const k = json?.kpi ?? {};
      const advice: string[] = json?.advice ?? [];

      // ラフスコア（返ってこない場合は推定）
      const score =
        typeof json?.score === 'number'
          ? json.score
          : Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  (k.ltvToCac ? Math.min(k.ltvToCac, 6) / 6 : 0) * 55 + // LTV/CAC寄与
                    (k.grossMargin ? Math.min(k.grossMargin, 60) / 60 : 0) * 25 + // 粗利
                    (k.paybackMonths ? Math.max(0, 24 - k.paybackMonths) / 24 : 0) * 20 // 回収
                )
              )
            );

      const strengths: string[] = [];
      const risks: string[] = [];
      const improvements: string[] = [];
      const checks: string[] = [];

      (advice as string[]).forEach((a) => {
        if (a.includes('強み')) strengths.push(a.replace('強み: ', ''));
        else if (a.includes('改善')) improvements.push(a.replace('改善: ', ''));
        else risks.push(a);
      });

      // 目視チェック欄（例）
      checks.push(
        `売上: ${k?.grossProfit !== undefined ? (k.grossProfit + (n(form.ad_cost) ?? 0)).toLocaleString() : '0'} / 損益分岐CV: ${
          k?.breakEvenCV ?? '—'
        } / 粗利率: ${k?.grossMargin ?? 0}%`
      );
      checks.push(
        `LTV/CAC: ${k?.ltvToCac ?? 0} / 回収率(月): ${k?.paybackMonths ?? 0}`
      );

      setAnalysis({
        score,
        kpi: {
          grossProfit: k.grossProfit ?? 0,
          grossMargin: k.grossMargin ?? 0,
          unitCost: k.unitCost ?? 0,
          contribution: k.contribution ?? 0,
          ltvToCac: k.ltvToCac ?? 0,
          paybackMonths: k.paybackMonths ?? 0,
          perCVProfitAfterAds: k.perCVProfitAfterAds ?? 0,
          breakEvenCV: k.breakEvenCV ?? null,
        },
        strengths,
        risks,
        improvements,
        checks,
      });

      setMsg('✅ 解析完了');
    } catch (e: any) {
      setMsg(`AI解析エラー: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  // フロント → 保存用の共通ペイロード
  function buildSavePayload() {
    return {
      title: form.title || null,
      company_name: form.company_name || null,
      industry: form.industry || null,
      phase: form.phase || null,
      revenue: n(form.revenue) || null,
      summary: form.summary || null,
      cogs: n(form.cogs) || null,
      fixed_cost: n(form.fixed_cost) || null,
      ad_cost: n(form.ad_cost) || null,
      cv: n(form.cv) || null,
      cvr: n(form.cvr) || null,
      price: n(form.price) || null,
      cpa: n(form.cpa) || null,
      ltv: n(form.ltv) || null,
      churn: n(form.churn) || null,
      ai_score: analysis?.score ?? null,
      tags: null,
    };
  }

  // ---- 公開申請（保存→ /publish を一気通貫）----
  async function requestPublish() {
    try {
      setSaving(true);
      setMsg(null);

      // ① 保存
      const saveRes = await fetch('/api/fpl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson?.error?.message ?? `status ${saveRes.status}`);

      const id = saveJson?.data?.id as string;
      if (!id) throw new Error('保存IDを取得できませんでした');

      // ② 申請
      const pubRes = await fetch(`/api/fpl/${id}/publish`, { method: 'POST' });
      const pubJson = await pubRes.json();
      if (!pubRes.ok || !pubJson?.ok) throw new Error(pubJson?.error ?? `status ${pubRes.status}`);

      setMsg('✅ 公開申請を受け付けました（審査中）');
    } catch (e: any) {
      setMsg(`公開申請に失敗: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>
      <p className="text-sm text-gray-600">
        入力後に <b>AI解析</b> をクリックすると、AIがスコアと要約・KPIを生成します。内容を確認して <b>公開申請</b> すると、投資家プレビュー（/investors/:id）へ掲出申請します。
      </p>

      {/* --- 入力フォーム（左：基本、右：PL・KPI） --- */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 事業の基本情報 */}
        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold text-lg">事業の基本情報</h2>

          <label className="text-sm block">
            <span className="block mb-1 text-gray-600">会社名（company_name）</span>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="例）株式会社○○"
              value={form.company_name}
              onChange={onChange('company_name')}
            />
          </label>

          <label className="text-sm block">
            <span className="block mb-1 text-gray-600">30字要約（title）</span>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="例）フランチャイザー向けの配送サービスプラットフォーム"
              value={form.title}
              onChange={onChange('title')}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">業種</span>
              <select className="w-full rounded border px-3 py-2" value={form.industry} onChange={onChange('industry')}>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || '選択してください'}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">フェーズ</span>
              <select className="w-full rounded border px-3 py-2" value={form.phase} onChange={onChange('phase')}>
                {phaseOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || '選択してください'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm block">
            <span className="block mb-1 text-gray-600">概要（summary）</span>
            <textarea
              className="w-full rounded border px-3 py-2 h-28"
              placeholder="事業概要や補足事項を記入"
              value={form.summary}
              onChange={onChange('summary')}
            />
          </label>
        </div>

        {/* PL・KPI（簡易） */}
        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold text-lg">PL・KPI（簡易）</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">売上</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.revenue} onChange={onChange('revenue')} />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">売上原価</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.cogs} onChange={onChange('cogs')} />
            </label>

            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">広告費</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.ad_cost} onChange={onChange('ad_cost')} />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">固定費</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.fixed_cost} onChange={onChange('fixed_cost')} />
            </label>

            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">CV数</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.cv} onChange={onChange('cv')} />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">平均単価</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.price} onChange={onChange('price')} />
            </label>

            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">CVR(%)</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.cvr} onChange={onChange('cvr')} />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">CPA</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.cpa} onChange={onChange('cpa')} />
            </label>

            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">LTV</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.ltv} onChange={onChange('ltv')} />
            </label>
            <label className="text-sm block">
              <span className="block mb-1 text-gray-600">解約率/月(%)</span>
              <input className="w-full rounded border px-3 py-2" inputMode="numeric" value={form.churn} onChange={onChange('churn')} />
            </label>
          </div>
        </div>
      </section>

      {/* --- ボタン行 --- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={analyze}
          disabled={saving}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? '解析中…' : 'AI解析する'}
        </button>

        {/* 投資家プレビューボタンは削除し、「公開申請」のみ残す */}
        <button
          type="button"
          onClick={requestPublish}
          disabled={saving}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? '申請中…' : '公開申請'}
        </button>

        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>

      {/* --- 解析結果（カード群） --- */}
      <section className="space-y-4">
        {/* スコア & メーター */}
        <div className="rounded-2xl border p-5">
          <h3 className="font-semibold mb-3">AI解析スコア</h3>
          {analysis ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-1">
                <div className="text-4xl font-bold">{analysis.score}</div>
                <div className="text-xs text-gray-500 mt-1">（0-100）</div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <Metric label="粗利率(%)" value={analysis.kpi.grossMargin} />
                <Metric label="LTV/CAC" value={analysis.kpi.ltvToCac} />
                <Metric label="回収(月)" value={analysis.kpi.paybackMonths} />
                <Metric label="1CV利益(広告差引後)" value={analysis.kpi.perCVProfitAfterAds} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">AI解析後に表示されます。</p>
          )}
        </div>

        {/* 強み / リスク / 改善提案 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardList title="強み" items={analysis?.strengths ?? []} />
          <CardList title="リスク" items={analysis?.risks ?? []} />
          <CardList title="改善提案" items={analysis?.improvements ?? []} />
        </div>

        {/* 整合性チェック */}
        <div className="rounded-2xl border p-5">
          <h3 className="font-semibold mb-3">整合性チェック</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {(analysis?.checks ?? []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

// ちょい便利UI
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value ?? 0}</div>
    </div>
  );
}

function CardList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {items.length ? (
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  );
}
