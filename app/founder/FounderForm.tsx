'use client';

import { useEffect, useMemo, useState } from 'react';

type Phase = 'Pre' | 'Seed' | 'SeriesA' | 'SeriesB';
type Industry = 'SaaS' | 'Other';

type PlInput = {
  revenue: number;
  cogs: number;
  adCost: number;
  fixedCost: number;
  cv: number;
  price: number;
  cvr: number; // %
  cpa: number;
  ltv: number;
  churn: number; // % / month
};

type FormState = {
  title: string;
  summary: string;
  industry: Industry;
  phase: Phase;
  pl: PlInput;
};

const EMPTY: FormState = {
  title: '',
  summary: '',
  industry: 'SaaS',
  phase: 'Pre',
  pl: {
    revenue: 0,
    cogs: 0,
    adCost: 0,
    fixedCost: 0,
    cv: 0,
    price: 0,
    cvr: 0,
    cpa: 0,
    ltv: 0,
    churn: 0,
  },
};

const STORAGE_KEY = 'pb-founder-form-v1';

export default function FounderForm() {
  const [state, setState] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  // ① 起動時に localStorage から復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(prev => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
    setLoaded(true);
  }, []);

  // ② 入力のたびに localStorage へ保存（デバウンスなし＝まずはシンプルに）
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, loaded]);

  const update = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setState(s => ({ ...s, [key]: v }));

  const updatePl = <K extends keyof PlInput>(key: K, v: number) =>
    setState(s => ({ ...s, pl: { ...s.pl, [key]: Number.isFinite(v) ? v : 0 } }));

  const number = (e: React.ChangeEvent<HTMLInputElement>) =>
    parseFloat(e.target.value || '0');

  const onAnalyze = () => {
    // TODO: ここに「AI解析する」の本処理を移植（昔のロジックを貼り付け）
    alert('AI解析ダミー。ローカル保存は動いています。');
  };

  const onReset = () => {
    if (!confirm('入力をリセットしますか？（保存データも削除）')) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(EMPTY);
  };

  // 昨日の見た目に寄せた最小の骨格（Tailwind前提）
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-lg font-semibold">Partner Box — PoC Mock</h1>
        <div className="flex gap-2">
          <a href="/founder" className="rounded border px-3 py-1">起業家</a>
          <a href="/investor" className="rounded border px-3 py-1">投資家</a>
          <a href="/ops" className="rounded border px-3 py-1">運営</a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 左：基本情報 */}
        <section className="rounded-2xl border p-6">
          <h2 className="mb-4 text-sm font-semibold">案件の基本情報</h2>

          <label className="mb-3 block text-sm">
            案件名
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="例：〇〇向けSaaS"
              value={state.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </label>

          <label className="mb-3 block text-sm">
            30字要約
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="例：美容サロン向け予約SaaS"
              value={state.summary}
              onChange={(e) => update('summary', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              業種
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={state.industry}
                onChange={(e) => update('industry', e.target.value as Industry)}
              >
                <option value="SaaS">SaaS</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="block text-sm">
              フェーズ
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={state.phase}
                onChange={(e) => update('phase', e.target.value as Phase)}
              >
                <option value="Pre">Pre</option>
                <option value="Seed">Seed</option>
                <option value="SeriesA">SeriesA</option>
                <option value="SeriesB">SeriesB</option>
              </select>
            </label>
          </div>
        </section>

        {/* 右：PL・KPI（簡易） */}
        <section className="rounded-2xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">PL・KPI（簡易）</h2>
            <span className="text-xs text-gray-500">＊必須最小</span>
          </div>

          {([
            ['売上', 'revenue'],
            ['売上原価', 'cogs'],
            ['広告費', 'adCost'],
            ['固定費', 'fixedCost'],
            ['CV数', 'cv'],
            ['平均単価', 'price'],
            ['CVR(%)', 'cvr'],
            ['CPA', 'cpa'],
            ['LTV', 'ltv'],
            ['解約率/月(%)', 'churn'],
          ] as const).map(([label, key]) => (
            <label key={key} className="mb-3 block text-sm">
              {label}
              <input
                inputMode="decimal"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={state.pl[key]}
                onChange={(e) => updatePl(key, number(e))}
              />
            </label>
          ))}

          <div className="mt-4 flex gap-2">
            <button
              onClick={onAnalyze}
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              AI解析する
            </button>
            <button
              onClick={onReset}
              className="rounded-md border px-4 py-2"
            >
              リセット
            </button>
          </div>
        </section>
      </div>

      <p className="py-8 text-center text-xs text-gray-500">
        PoC Mock — この画面はローカル状態のみで動作しています
      </p>
    </div>
  );
}
