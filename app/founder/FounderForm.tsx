'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ============ 型 ============ */
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
  pl: PLText;
};

type Analysis = {
  aiScore: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  subs: { finance: number; viability: number; gtm: number; risk: number };
  strengths: string[];
  risks: string[];
  suggestions: string[];
  checks: string[];
  metrics: Record<string, number | string>;
};

/* ============ 定数 ============ */
const INDUSTRIES = ['SaaS', 'E-commerce', 'Marketplace', 'Media', 'Other'] as const;
const PHASES = ['Pre', 'Seed', 'SeriesA', 'SeriesB', 'Later'] as const;

const LS_DRAFT = 'pb_founder_draft_v2';
const LS_SUBMIT = 'pb_submissions_v1';

/* ============ ユーティリティ ============ */
function cleanNumericInput(v: string) {
  let s = v.replace(/,/g, '').replace(/[^\d.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  if (s !== '' && s !== '0' && !s.startsWith('0.')) s = s.replace(/^0+(?=\d)/, '');
  return s;
}
const toNum = (s: string) => {
  const x = cleanNumericInput(s).trim();
  return x === '' ? 0 : parseFloat(x);
};
function formatWithCommas(raw: string) {
  const s = cleanNumericInput(raw);
  if (s === '') return '';
  const [i, d] = s.split('.');
  const intFmt = Number(i).toLocaleString();
  return d !== undefined ? `${intFmt}.${d}` : intFmt;
}
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

/* ============ スコアリング（簡易） ============ */
function analyzeLikeOldUI(d: Draft): Analysis {
  const pl: PL = {
    revenue: toNum(d.pl.revenue),  cogs: toNum(d.pl.cogs),
    fixedCost: toNum(d.pl.fixedCost), adCost: toNum(d.pl.adCost),
    cv: toNum(d.pl.cv), cvr: toNum(d.pl.cvr) / 100,
    price: toNum(d.pl.price), cpa: toNum(d.pl.cpa),
    ltv: toNum(d.pl.ltv), churn: toNum(d.pl.churn) / 100,
  };

  const gross = Math.max(pl.revenue - pl.cogs, 0);
  const op = pl.revenue - pl.cogs - pl.fixedCost - pl.adCost;

  const grossMargin = pl.revenue > 0 ? gross / pl.revenue : 0;
  const opMargin    = pl.revenue > 0 ? op / pl.revenue : 0;
  const cac         = pl.cpa > 0 ? pl.cpa : (pl.cv > 0 ? pl.adCost / pl.cv : 0);
  const paybackOK   = pl.ltv > 0 && cac > 0 ? pl.ltv / cac >= 3 : false;

  const finance  = Math.min(100, Math.max(0, grossMargin * 120));
  const viability = Math.min(100, Math.max(0, (opMargin + 0.25) * 120));
  const gtm      = Math.min(100, Math.max(0, (pl.cvr * 2 + (pl.price ? 0.2 : 0)) * 100));
  const risk     = Math.min(100, Math.max(0, (paybackOK ? 90 : 60) - (pl.churn * 100)));

  const aiScore = Math.round(0.35 * finance + 0.35 * viability + 0.2 * gtm + 0.1 * risk);
  const rank: Analysis['rank'] =
    aiScore >= 85 ? 'S' : aiScore >= 75 ? 'A' : aiScore >= 65 ? 'B' : aiScore >= 50 ? 'C' : 'D';

  const strengths: string[] = [];
  if (grossMargin >= 0.6) strengths.push('粗利率が高くコスト構造が良好です');
  if (paybackOK) strengths.push('LTV/CAC が 3x 以上で投資耐性あり');

  const risks: string[] = [];
  if (pl.cvr === 0) risks.push('CVR が未入力または 0% です');
  if (pl.price === 0) risks.push('平均単価が未入力です');
  if (pl.churn > 0.08) risks.push('解約率が高めです（> 8%/月）');

  const suggestions: string[] = [];
  if (pl.cvr < 0.02) suggestions.push('CVR 改善（LP最適化/導線見直し）を検討');
  if (cac > 0 && pl.ltv > 0 && pl.ltv / cac < 3) suggestions.push('CAC抑制 または LTV向上（継続率・単価）に注力');
  if (op <= 0) suggestions.push('固定費/広告費の最適化で営業利益の黒字化を目指す');

  const checks: string[] = [];
  checks.push(`売上: ${pl.revenue.toLocaleString()} / 売上原価: ${pl.cogs.toLocaleString()} / 粗利率: ${pct(grossMargin)}`);
  checks.push(`営業利益: ${op.toLocaleString()} / 営業利益率: ${pct(opMargin)}`);
  checks.push(`LTV: ${pl.ltv.toLocaleString()} / CAC: ${Math.round(cac).toLocaleString()} / LTV/CAC: ${cac ? (pl.ltv / cac).toFixed(2) : '-'}`);
  checks.push(`CV: ${pl.cv} / CVR: ${(pl.cvr * 100).toFixed(1)}% / 単価: ${pl.price.toLocaleString()}`);
  checks.push(`解約率(月): ${(pl.churn * 100).toFixed(1)}%`);

  const metrics = {
    粗利益: gross.toLocaleString(),
    営業利益: op.toLocaleString(),
    '粗利率': (grossMargin * 100).toFixed(1) + '%',
    '営業利益率': (opMargin * 100).toFixed(1) + '%',
  };

  return {
    aiScore, rank,
    subs: { finance: Math.round(finance), viability: Math.round(viability), gtm: Math.round(gtm), risk: Math.round(risk) },
    strengths, risks, suggestions, checks, metrics,
  };
}

/* ============ 本体 ============ */
export default function FounderForm() {
  const init: Draft = useMemo(() => ({
    title: '', summary: '', industry: INDUSTRIES[0], phase: PHASES[0],
    pl: { revenue:'', cogs:'', fixedCost:'', adCost:'', cv:'', cvr:'', price:'', cpa:'', ltv:'', churn:'' },
  }), []);

  const [draft, setDraft] = useState<Draft>(init);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_DRAFT); if (raw) setDraft(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(draft)); } catch {}
  }, [draft]);

  const setField = (k: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft(d => ({ ...d, [k]: e.target.value }));

  const setPL = (k: keyof PLText) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft(d => ({ ...d, pl: { ...d.pl, [k]: cleanNumericInput(e.target.value) } }));

  const clearAll = () => { setDraft(init); setAnalysis(null); setSubmittedId(null); localStorage.removeItem(LS_DRAFT); };

  const onAnalyze = async () => {
    setLoading(true);
    try { setAnalysis(analyzeLikeOldUI(draft)); } finally { setLoading(false); }
  };

  // ✅ ここを DB 保存に対応
  const onSubmit = async () => {
    if (!analysis) { alert('先に「AI解析する」を実行してください'); return; }
    if (!draft.title.trim()) { alert('案件名を入力してください'); return; }
    setSubmitting(true);
    try {
      // ローカル保存向けのメタ情報（従来どおり保持）
      const payloadForLocal = {
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
        analysis,
      };

      // 🔽 DB（founder_pl）に保存するためのフラット化（APIの期待形）
      const payloadForDb = {
        title: draft.title,
        summary: draft.summary,
        industry: draft.industry,
        phase: draft.phase,
        revenue: toNum(draft.pl.revenue),
        cogs: toNum(draft.pl.cogs),
        ad_cost: toNum(draft.pl.adCost),
        fixed_cost: toNum(draft.pl.fixedCost),
        cv: toNum(draft.pl.cv),
        price: toNum(draft.pl.price),
        cvr: toNum(draft.pl.cvr),
        cpa: toNum(draft.pl.cpa),
        ltv: toNum(draft.pl.ltv),
        churn: toNum(draft.pl.churn),
        ai_score: analysis.aiScore,
      };

      // ✅ Supabase へ保存
      const id = await saveToSupabase(payloadForDb);

      // 従来のローカル保存も更新（投資家画面のPoC参照用）
      const raw = localStorage.getItem(LS_SUBMIT);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ id, ...payloadForLocal });
      localStorage.setItem(LS_SUBMIT, JSON.stringify(arr));

      setSubmittedId(id);
      alert(`公開申請を受け付けました（ID: ${id}）`);
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
        <div className="ml-auto text-sm">{submittedId && <span className="text-green-600">申請済: {submittedId}</span>}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 入力 */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">案件の基本情報</h2>

          <Labeled label="案件名">
            <input className="w-full rounded-md border px-3 py-2" placeholder="例：○○向けSaaS"
              value={draft.title} onChange={setField('title')} />
          </Labeled>

          <Labeled label="30字要約">
            <input className="w-full rounded-md border px-3 py-2" placeholder="例：美容サロン向け予約SaaS"
              value={draft.summary} onChange={setField('summary')} />
          </Labeled>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <Labeled label="業種">
              <select className="w-full rounded-md border px-3 py-2" value={draft.industry} onChange={setField('industry')}>
                {INDUSTRIES.map(v => <option key={v}>{v}</option>)}
              </select>
            </Labeled>
            <Labeled label="フェーズ">
              <select className="w-full rounded-md border px-3 py-2" value={draft.phase} onChange={setField('phase')}>
                {PHASES.map(v => <option key={v}>{v}</option>)}
              </select>
            </Labeled>
          </div>

          <h2 className="mb-3 mt-6 text-lg font-semibold">PL・KPI（簡易）</h2>
          <div className="grid grid-cols-2 gap-3">
            <Num label="売上"         v={draft.pl.revenue}   onChange={setPL('revenue')} />
            <Num label="売上原価"     v={draft.pl.cogs}      onChange={setPL('cogs')} />
            <Num label="固定費"       v={draft.pl.fixedCost} onChange={setPL('fixedCost')} />
            <Num label="広告費"       v={draft.pl.adCost}    onChange={setPL('adCost')} />
            <Num label="CV数"         v={draft.pl.cv}        onChange={setPL('cv')} />
            <Num label="CVR(%)"       v={draft.pl.cvr}       onChange={setPL('cvr')} />
            <Num label="平均単価"      v={draft.pl.price}     onChange={setPL('price')} />
            <Num label="CPA"          v={draft.pl.cpa}       onChange={setPL('cpa')} />
            <Num label="LTV"          v={draft.pl.ltv}       onChange={setPL('ltv')} />
            <Num label="解約率/月(%)"  v={draft.pl.churn}     onChange={setPL('churn')} />
          </div>

          <div className="mt-6 flex gap-3">
            <button className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                    onClick={onAnalyze} disabled={loading}>
              {loading ? '解析中…' : 'AI解析する'}
            </button>
            <button className="rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-50" onClick={clearAll} type="button">
              クリア
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            入力値はブラウザに自動保存されます（キー: <code>{LS_DRAFT}</code>）。
          </p>
        </section>

        {/* 出力 */}
        <section className="space-y-4">
          {!analysis ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
              「AI解析する」を押すと結果が表示されます。
            </div>
          ) : (
            <>
              {/* スコア + レーダー */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-extrabold tracking-tight">{analysis.aiScore}</div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">ランク {analysis.rank}</span>
                  </div>
                  <Radar
                    values={[
                      analysis.subs.finance,
                      analysis.subs.viability,
                      analysis.subs.gtm,
                      100 - analysis.subs.risk + 0,
                    ]}
                    labels={['Finance','Viability','GTM','Risk↓']}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Bar label="Finance Fit" v={analysis.subs.finance} />
                  <Bar label="Viability"   v={analysis.subs.viability} />
                  <Bar label="Go-To-Market" v={analysis.subs.gtm} />
                  <Bar label="Risk(安全度)" v={analysis.subs.risk} />
                </div>
              </div>

              <MetricPanel title="ハイライト" metrics={analysis.metrics} />

              <Panel title="強み">
                {analysis.strengths.length === 0 ? <p className="text-sm text-gray-500">—</p> :
                  <ul className="list-disc pl-5 text-sm space-y-1">{analysis.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul>}
              </Panel>

              <Panel title="リスク">
                {analysis.risks.length === 0 ? <p className="text-sm text-gray-500">—</p> :
                  <ul className="list-disc pl-5 text-sm space-y-1">{analysis.risks.map((s,i)=><li key={i}>{s}</li>)}</ul>}
              </Panel>

              <Panel title="改善提案">
                {analysis.suggestions.length === 0 ? <p className="text-sm text-gray-500">—</p> :
                  <ul className="list-disc pl-5 text-sm space-y-1">{analysis.suggestions.map((s,i)=><li key={i}>{s}</li>)}</ul>}
              </Panel>

              <Panel title="整合性チェック">
                <ul className="text-sm space-y-1">
                  {analysis.checks.map((s,i)=><li key={i}>・{s}</li>)}
                </ul>
              </Panel>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold">次のアクション</h3>
                <div className="flex gap-3">
                  <button className="rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-50" onClick={onAnalyze}>
                    修正して再解析
                  </button>
                  <button className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                          onClick={onSubmit} disabled={submitting}>
                    {submitting ? '申請中…' : '公開申請'}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  申請は PoC としてブラウザ保存され、投資家画面（/investor）で一覧・詳細を確認できます（キー: <code>{LS_SUBMIT}</code>）。
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============ 小物 ============ */
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Num({ label, v, onChange }: { label: string; v: string; onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? v : formatWithCommas(v);
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-700">{label}</label>
      <input
        type="text" inputMode="decimal" className="w-full rounded-md border px-3 py-2"
        placeholder="0" value={display}
        onChange={(e)=>{ e.target.value = cleanNumericInput(e.target.value); onChange(e as any); }}
        onFocus={(e)=>{ setFocused(true); requestAnimationFrame(()=>{ const el=e.currentTarget; const len=el.value.length; el.setSelectionRange(len,len); }); }}
        onBlur={()=>setFocused(false)}
      />
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>{label}</span><span>{v}</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-100">
        <div className="h-2 rounded bg-black" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function MetricPanel({ title, metrics }: { title: string; metrics: Record<string, number | string> }) {
  const entries = Object.entries(metrics);
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([k,v])=>(
          <div key={k} className="rounded-lg border px-4 py-3">
            <div className="text-xs text-gray-500">{k}</div>
            <div className="text-lg font-semibold">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* シンプルSVGレーダー（外部ライブラリ不要） */
function Radar({ values, labels }: { values: number[]; labels: string[] }) {
  const size = 120, R = 50, cx = 70, cy = 60;
  const max = 100;
  const n = values.length;

  const toXY = (i: number, val: number) => {
    const a = (-Math.PI / 2) + (2 * Math.PI * i / n);
    const r = (val / max) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const outer = Array.from({length: n}, (_,i)=>toXY(i, max)).map(p=>p.join(',')).join(' ');
  const poly  = values.map((v,i)=>toXY(i, v)).map(p=>p.join(',')).join(' ');

  return (
    <svg width={size} height={size} className="text-gray-400">
      {/* 外枠 */}
      <polygon points={outer} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* 中心線 */}
      {Array.from({length:n},(_,i)=>{
        const [x2,y2]=toXY(i,max);
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="currentColor" opacity="0.2"/>;
      })}
      {/* 値ポリゴン */}
      <polygon points={poly} fill="black" opacity="0.15" stroke="black" />
      {/* ラベル */}
      {labels.map((t,i)=>{
        const [x,y]=toXY(i,max+8);
        return <text key={i} x={x} y={y} textAnchor="middle" fontSize="10" className="fill-gray-600">{t}</text>;
      })}
    </svg>
  );
}

/* ========= DB 保存呼び出し ========= */
async function saveToSupabase(payload: any) {
  try {
    const res = await fetch('/api/founder_pl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'failed to save')
    return json.id as string;
  } catch (err: any) {
    console.error(err)
    throw err;
  }
}
