'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* =========================
   型定義
   ========================= */
type PL = {
  revenue: number; cogs: number; fixedCost: number; adCost: number;
  cv: number; cvr: number; price: number; cpa: number; ltv: number; churn: number;
};
type PLText = { [K in keyof PL]: string };

type Draft = {
  title: string;
  summary: string;
  industry: string;
  phase: string;
  pl: PLText; // 表示用は文字列
};

type AnalyzeResult = {
  summary?: string;
  metrics?: Record<string, number | string>;
  advice?: string[];
};

const INDUSTRIES = ['SaaS', 'E-commerce', 'Marketplace', 'Media', 'Other'] as const;
const PHASES = ['Pre', 'Seed', 'SeriesA', 'SeriesB', 'Later'] as const;

const LS_DRAFT = 'pb_founder_draft_v2';
const LS_SUBMIT = 'pb_submissions_v1';  // 申請データ一覧（PoC用）

/* =========================
   ユーティリティ
   ========================= */

// 数値入力クリーニング（空可／,除去／小数点1つ／先頭ゼロ除去。ただし "0." 許容）
function cleanNumericInput(v: string) {
  let s = v.replace(/,/g, '').replace(/[^\d.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  if (s !== '' && s !== '0' && !s.startsWith('0.')) {
    s = s.replace(/^0+(?=\d)/, '');
  }
  return s;
}
const toNum = (s: string) => {
  const x = cleanNumericInput(s).trim();
  return x === '' ? 0 : parseFloat(x);
};
function formatWithCommas(raw: string) {
  const s = cleanNumericInput(raw);
  if (s === '') return '';
  const [intPart, decPart] = s.split('.');
  const intFmt = Number(intPart).toLocaleString();
  return decPart !== undefined ? `${intFmt}.${decPart}` : intFmt;
}

/* =========================
   本体
   ========================= */
export default function FounderForm() {
  // 初期ドラフト
  const blank: Draft = useMemo(
    () => ({
      title: '', summary: '',
      industry: INDUSTRIES[0], phase: PHASES[0],
      pl: { revenue:'', cogs:'', fixedCost:'', adCost:'', cv:'', cvr:'', price:'', cpa:'', ltv:'', churn:'' },
    }),
    []
  );

  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // 起動時：保存値復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT);
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, []);
  // 自動保存
  useEffect(() => {
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(draft)); } catch {}
  }, [draft]);

  // 入力ハンドラ
  const setField = (key: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft(d => ({ ...d, [key]: e.target.value }));

  const setPL = (key: keyof PLText) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = cleanNumericInput(e.target.value);
      setDraft(d => ({ ...d, pl: { ...d.pl, [key]: v } }));
    };

  const clearAll = () => {
    setDraft(blank); setResult(null); setError(null);
    setSubmittedId(null);
    try { localStorage.removeItem(LS_DRAFT); } catch {}
  };

  // 解析
  const onAnalyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const plForApi: PL = {
        revenue: toNum(draft.pl.revenue),  cogs: toNum(draft.pl.cogs),
        fixedCost: toNum(draft.pl.fixedCost), adCost: toNum(draft.pl.adCost),
        cv: toNum(draft.pl.cv), cvr: toNum(draft.pl.cvr),
        price: toNum(draft.pl.price), cpa: toNum(draft.pl.cpa),
        ltv: toNum(draft.pl.ltv), churn: toNum(draft.pl.churn),
      };

      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: { ...draft, pl: plForApi } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      // フォールバック
      const gross = toNum(draft.pl.revenue) - toNum(draft.pl.cogs);
      const op    = gross - toNum(draft.pl.fixedCost) - toNum(draft.pl.adCost);
      setResult({
        summary: '（デモ）簡易計算の結果',
        metrics: { 粗利: gross, 営業利益: op },
        advice: [
          'CV数・CVR・単価のいずれかを上げると売上改善。',
          '固定費・広告費の見直しで営業利益の感度を確認。',
        ],
      });
      setError(typeof e?.message === 'string' ? e.message : '解析に失敗しました（デモ結果を表示）');
    } finally {
      setLoading(false);
    }
  };

  // 申請（PoC：localStorageに保存 + APIで受付ID発番）
  const onSubmitApplication = async () => {
    // 必須チェック（最低限）
    if (!draft.title.trim()) { alert('案件名を入力してください'); return; }
    if (!result) { alert('先に「AI解析する」を実行してください'); return; }

    setSubmitting(true);
    try {
      const payload = {
        meta: { createdAt: new Date().toISOString() },
        form: {
          ...draft,
          pl: {
            revenue: toNum(draft.pl.revenue),  cogs: toNum(draft.pl.cogs),
            fixedCost: toNum(draft.pl.fixedCost), adCost: toNum(draft.pl.adCost),
            cv: toNum(draft.pl.cv), cvr: toNum(draft.pl.cvr),
            price: toNum(draft.pl.price), cpa: toNum(draft.pl.cpa),
            ltv: toNum(draft.pl.ltv), churn: toNum(draft.pl.churn),
          },
        },
        analysis: result,
      };

      // APIへ（受付ID発番）
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const id: string = data.id;

      // ブラウザ保存（PoC）
      const raw = localStorage.getItem(LS_SUBMIT);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      arr.unshift({ id, ...payload });
      localStorage.setItem(LS_SUBMIT, JSON.stringify(arr));

      setSubmittedId(id);
      alert(`申請を受け付けました。\n受付ID: ${id}`);
    } catch (e: any) {
      alert(`申請に失敗しました：${e?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 役割選択に戻る</Link>
        <h1 className="text-2xl font-bold">起業家用フォーム</h1>
        <div className="ml-auto text-sm">
          {submittedId ? <span className="text-green-600">申請済: {submittedId}</span> : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 左：入力 */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">案件の基本情報</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-gray-700">案件名</label>
            <input
              type="text" className="w-full rounded-md border px-3 py-2"
              placeholder="例：○○向けSaaS"
              value={draft.title} onChange={setField('title')}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-gray-700">30字要約</label>
            <input
              type="text" className="w-full rounded-md border px-3 py-2"
              placeholder="例：美容サロン向け予約SaaS"
              value={draft.summary} onChange={setField('summary')}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">業種</label>
              <select className="w-full rounded-md border px-3 py-2" value={draft.industry} onChange={setField('industry')}>
                {INDUSTRIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">フェーズ</label>
              <select className="w-full rounded-md border px-3 py-2" value={draft.phase} onChange={setField('phase')}>
                {PHASES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-lg font-semibold">PL・KPI（簡易）</h2>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="売上"         value={draft.pl.revenue}   onChange={setPL('revenue')} />
            <NumberInput label="売上原価"     value={draft.pl.cogs}      onChange={setPL('cogs')} />
            <NumberInput label="固定費"       value={draft.pl.fixedCost} onChange={setPL('fixedCost')} />
            <NumberInput label="広告費"       value={draft.pl.adCost}    onChange={setPL('adCost')} />
            <NumberInput label="CV数"         value={draft.pl.cv}        onChange={setPL('cv')} />
            <NumberInput label="CVR(%)"       value={draft.pl.cvr}       onChange={setPL('cvr')} />
            <NumberInput label="平均単価"      value={draft.pl.price}     onChange={setPL('price')} />
            <NumberInput label="CPA"          value={draft.pl.cpa}       onChange={setPL('cpa')} />
            <NumberInput label="LTV"          value={draft.pl.ltv}       onChange={setPL('ltv')} />
            <NumberInput label="解約率/月(%)"  value={draft.pl.churn}     onChange={setPL('churn')} />
          </div>

          <div className="mt-6 flex gap-3">
            <button className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                    onClick={onAnalyze} disabled={loading}>
              {loading ? '解析中…' : 'AI解析する'}
            </button>
            <button className="rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-50"
                    onClick={clearAll} type="button">
              クリア
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            入力中の値は自動保存されます（ブラウザのみ／キー: <code>{LS_DRAFT}</code>）。
          </p>
        </section>

        {/* 右：結果＋申請 */}
        <section className="min-h-[280px] rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">解析結果</h2>

          {error && (
            <div className="mb-4 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}

          {!result && <p className="text-sm text-gray-500">「AI解析する」を押すと結果が表示されます。</p>}

          {result && (
            <div className="space-y-4">
              {result.summary && <p className="text-sm">{result.summary}</p>}

              {result.metrics && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">主要指標</h3>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(result.metrics).map(([k, v]) => (
                      <li key={k} className="flex justify-between rounded bg-gray-50 px-3 py-1">
                        <span className="text-gray-600">{k}</span>
                        <span className="font-medium">{String(v)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.advice && result.advice.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">アドバイス</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {result.advice.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onSubmitApplication}
                  disabled={submitting}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                  {submitting ? '申請中…' : (submittedId ? '再申請する' : '申請する')}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  申請すると PoC 環境ではブラウザに保存され、<code>{LS_SUBMIT}</code> に一覧化されます。
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* =========================
   サブ：数値入力（フォーカス外で千区切り）
   ========================= */
function NumberInput({
  label, value, onChange,
}: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? value : formatWithCommas(value);
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-700">{label}</label>
      <input
        type="text" inputMode="decimal" className="w-full rounded-md border px-3 py-2"
        placeholder="0" value={display}
        onChange={(e) => {
          const synthetic = { ...e, target: { ...e.target, value: cleanNumericInput(e.target.value) } } as React.ChangeEvent<HTMLInputElement>;
          onChange(synthetic);
        }}
        onFocus={(e) => { setFocused(true); const el = e.currentTarget; requestAnimationFrame(() => { const len = el.value.length; el.setSelectionRange(len, len); }); }}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}
