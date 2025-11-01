'use client';

import { useEffect, useMemo, useState } from 'react';

type PL = {
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

type Draft = {
  title: string;
  summary: string;
  industry: string;
  phase: string;
  pl: PL;
};

const blank: Draft = {
  title: '',
  summary: '',
  industry: 'SaaS',
  phase: 'Pre',
  pl: {
    revenue: 0,
    cogs: 0,
    fixedCost: 0,
    adCost: 0,
    cv: 0,
    cvr: 0,
    price: 0,
    cpa: 0,
    ltv: 0,
    churn: 0,
  },
};

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function FounderForm() {
  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    kpi: {
      grossProfit: number;
      grossMargin: number; // %
      unitCost: number;
      contribution: number;
      ltvToCac: number;
      paybackMonths: number;
      perCVProfitAfterAds: number;
      breakEvenCV: number | null;
    };
    advice: string[];
  }>(null);
  const [error, setError] = useState<string | null>(null);

  // --------------- localStorage 永続化 ---------------
  useEffect(() => {
    const raw = localStorage.getItem('pb_founder_draft_v1');
    if (raw) {
      try {
        setDraft(JSON.parse(raw));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('pb_founder_draft_v1', JSON.stringify(draft));
  }, [draft]);

  // --------------- 入力ハンドラ ---------------
  const setPL = (key: keyof PL) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, pl: { ...d.pl, [key]: num(e.target.value) } }));

  // --------------- AI解析 ---------------
  const onAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: draft }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || '解析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">起業家用フォーム</h1>
        <p className="text-sm opacity-70">
          ここに、以前トップページ（app/page.tsx）にあった PL / KPI 入力フォームを配置しました。
        </p>
      </header>

      {/* ------- 基本情報 ------- */}
      <section className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm">案件名</span>
          <input
            className="border rounded px-3 py-2"
            placeholder="例：〇〇向けSaaS"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">30字要約</span>
          <input
            className="border rounded px-3 py-2"
            placeholder="例：美容サロン向け予約SaaS"
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          />
        </label>
      </section>

      {/* ------- PL・KPI ------- */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <h2 className="font-semibold">PL・KPI（入力）</h2>
          {([
            ['revenue', '売上'],
            ['cogs', '売上原価'],
            ['fixedCost', '固定費'],
            ['adCost', '広告費'],
            ['cv', 'CV数'],
            ['cvr', 'CVR(%)'],
            ['price', '平均単価'],
            ['cpa', 'CPA'],
            ['ltv', 'LTV'],
            ['churn', '解約率/月(%)'],
          ] as [keyof PL, string][]).map(([key, label]) => (
            <label key={key} className="grid grid-cols-2 items-center gap-2">
              <span className="text-sm">{label}</span>
              <input
                type="number"
                className="border rounded px-3 py-2"
                value={draft.pl[key]}
                onChange={setPL(key)}
              />
            </label>
          ))}

          <div className="flex gap-3">
            <button
              onClick={onAnalyze}
              disabled={loading}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? '解析中…' : 'AI解析する'}
            </button>
            <button
              onClick={() => {
                setDraft(blank);
                setResult(null);
                setError(null);
              }}
              className="px-4 py-2 rounded border"
            >
              リセット
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* ------- 解析結果 ------- */}
        <div className="grid gap-3">
          <h2 className="font-semibold">解析結果</h2>
          {!result ? (
            <p className="text-sm opacity-70">「AI解析する」を押すと結果が表示されます。</p>
          ) : (
            <div className="rounded border p-4 grid gap-2">
              <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                <span>粗利益</span>
                <b>{result.kpi.grossProfit.toLocaleString()}</b>
                <span>粗利率</span>
                <b>{result.kpi.grossMargin}%</b>
                <span>1CVあたり原価</span>
                <b>{result.kpi.unitCost.toLocaleString()}</b>
                <span>1CVあたり粗利（広告費除く）</span>
                <b>{result.kpi.contribution.toLocaleString()}</b>
                <span>LTV/CAC</span>
                <b>{result.kpi.ltvToCac}</b>
                <span>広告費差引後の利益/1CV</span>
                <b>{result.kpi.perCVProfitAfterAds.toLocaleString()}</b>
                <span>固定費回収に必要なCV</span>
                <b>
                  {result.kpi.breakEvenCV === null
                    ? '計算不可（赤字構造）'
                    : result.kpi.breakEvenCV.toLocaleString()}
                </b>
                <span>予想回収期間（目安/月）</span>
                <b>{result.kpi.paybackMonths}</b>
              </div>

              <div className="pt-2">
                <h3 className="font-medium mb-1">アドバイス</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {result.advice.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs opacity-60">
        ※ 本解析はルールベースの簡易評価です。将来的にサーバ側でLLM解析へ切替可能な構成にしています。
      </p>
    </div>
  );
}
