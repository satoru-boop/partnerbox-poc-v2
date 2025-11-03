'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type Analysis = {
  score: number;
  rank: 'A'|'B'|'C'|'D';
  subscores: { financeFit: number; viability: number; goToMarket: number; risk: number; };
  kpi: {
    grossProfit: number; grossMargin: number; unitCost: number; contribution: number;
    ltvToCac: number; paybackMonths: number; perCVProfitAfterAds: number; breakEvenCV: number|null;
  };
  strengths: string[];
  risks: string[];
  improvements: string[];
  sanity: string[];
};

const INDUSTRY_OPTIONS = ['SaaS','医療','小売','製造','マーケティング','教育','Fintech','その他'];
const PHASE_OPTIONS    = ['Seed','Pre-Seed','Series A','Series B+','PMF以降','その他'];

export default function FormClient() {
  const router = useRouter();
  const [saving, setSaving]         = React.useState(false);
  const [analyzing, setAnalyzing]   = React.useState(false);
  const [msg, setMsg]               = React.useState<string|null>(null);
  const [msgOk, setMsgOk]           = React.useState(false); // 成功なら緑、失敗なら赤で表示

  const [form, setForm] = React.useState({
    title: '', company_name: '', industry: '', phase: '', summary: '',
    revenue: '', cogs: '', ad_cost: '', fixed_cost: '',
    cv: '', price: '', cvr: '', cpa: '', ltv: '', churn: '',
  });

  const [analysis, setAnalysis] = React.useState<Analysis|null>(null);
  const latestIdRef = React.useRef<string|null>(null);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(s => ({ ...s, [k]: e.target.value }));

  const n = (v: string) => (v === '' ? 0 : Number(v));

  // ============ AI解析 ============
  async function onAnalyze() {
    setAnalyzing(true); setMsg(null);
    try {
      const payload = {
        form: {
          title: form.title,
          summary: form.summary,
          industry: form.industry,
          phase: form.phase,
          pl: {
            revenue: n(form.revenue), cogs: n(form.cogs), fixedCost: n(form.fixed_cost),
            adCost: n(form.ad_cost), cv: n(form.cv), cvr: n(form.cvr),
            price: n(form.price), cpa: n(form.cpa), ltv: n(form.ltv), churn: n(form.churn),
          },
        },
      };
      const res  = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);
      setAnalysis(json);
    } catch (e:any) {
      setMsgOk(false); setMsg(`AI解析エラー: ${e?.message ?? String(e)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // ============ 保存（IDを返すように修正） ============
  async function onSave(): Promise<string> {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/fpl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);

      const id = json?.data?.id as string;
      latestIdRef.current = id;
      setMsgOk(true); setMsg('保存しました');
      return id;
    } catch (e:any) {
      setMsgOk(false); setMsg(`保存エラー: ${e?.message ?? String(e)}`);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  // ============ 公開申請（IDが無ければ自動保存→申請） ============
  async function requestPublish() {
    setSaving(true); setMsg(null);
    try {
      let id = latestIdRef.current;
      if (!id) {
        // まず保存してIDを取得
        id = await onSave();
      }

      const res  = await fetch(`/api/fpl/${id}/publish`, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);
      setMsgOk(true); setMsg(json.message ?? '公開申請を受け付けました（審査中に移行）');
    } catch (e:any) {
      setMsgOk(false); setMsg(`申請エラー: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  // ============ UI ============
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左：基本情報 */}
        <section className="rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold mb-1">事業の基本情報</h2>

          <label className="text-sm block">
            <span className="block text-gray-600 mb-1">会社名（company_name）</span>
            <input className="w-full rounded border px-3 py-2"
              value={form.company_name} onChange={onChange('company_name')} placeholder="例）株式会社サンプル" />
          </label>

          <label className="text-sm block">
            <span className="block text-gray-600 mb-1">30字要約（title）</span>
            <input className="w-full rounded border px-3 py-2"
              value={form.title} onChange={onChange('title')}
              placeholder="フランチャイザー向けの配送サービスプラットフォーム" />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">業種</span>
              <select className="w-full rounded border px-3 py-2" value={form.industry} onChange={onChange('industry')}>
                <option value="">選択してください</option>
                {INDUSTRY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="text-sm">
              <span className="block text-gray-600 mb-1">フェーズ</span>
              <select className="w-full rounded border px-3 py-2" value={form.phase} onChange={onChange('phase')}>
                <option value="">選択してください</option>
                {PHASE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* 右：PL・KPI */}
        <section className="rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold mb-1">PL・KPI（簡易）</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Num label="売上" val={form.revenue} onChange={onChange('revenue')} />
            <Num label="売上原価" val={form.cogs} onChange={onChange('cogs')} />
            <Num label="広告費" val={form.ad_cost} onChange={onChange('ad_cost')} />
            <Num label="固定費" val={form.fixed_cost} onChange={onChange('fixed_cost')} />
            <Num label="CV数" val={form.cv} onChange={onChange('cv')} />
            <Num label="平均単価" val={form.price} onChange={onChange('price')} />
            <Num label="CVR(%)" val={form.cvr} onChange={onChange('cvr')} />
            <Num label="CPA" val={form.cpa} onChange={onChange('cpa')} />
            <Num label="LTV" val={form.ltv} onChange={onChange('ltv')} />
            <Num label="解約率/月(%)" val={form.churn} onChange={onChange('churn')} />
          </div>

          <button type="button" onClick={onAnalyze} disabled={analyzing}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
            {analyzing ? 'AI解析中…' : 'AI解析する'}
          </button>
        </section>
      </div>

      {/* 解析結果が出たら下段UIを表示 */}
      {analysis && (
        <>
          <section className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-3">AI解析スコア</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex items-center gap-5">
                <div className="text-5xl font-extrabold tracking-tight">{analysis.score}</div>
                <div className="mt-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs">ランク {analysis.rank}</span>
                  <div className="mt-3 space-y-2 text-sm">
                    <Bar label="Finance Fit" value={analysis.subscores.financeFit} />
                    <Bar label="Viability" value={analysis.subscores.viability} />
                    <Bar label="Go-To-Market" value={analysis.subscores.goToMarket} />
                    <Bar label="Risk" value={analysis.subscores.risk} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Metric label="粗利益" val={analysis.kpi.grossProfit} />
                <Metric label="粗利率(%)" val={analysis.kpi.grossMargin} />
                <Metric label="1CV原価ざっくり" val={analysis.kpi.unitCost} />
                <Metric label="1CV粗利" val={analysis.kpi.contribution} />
                <Metric label="LTV/CAC" val={analysis.kpi.ltvToCac} />
                <Metric label="Payback(月)" val={analysis.kpi.paybackMonths} />
                <Metric label="広告差引後1CV利益" val={analysis.kpi.perCVProfitAfterAds} />
                <Metric label="損益分岐CV" val={analysis.kpi.breakEvenCV ?? '-'} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <CardList title="強み"         items={analysis.strengths}   />
            <CardList title="リスク"       items={analysis.risks}       />
            <CardList title="改善提案"     items={analysis.improvements}/>
          </section>

          <section className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-2">整合性チェック</h3>
            <ul className="list-disc pl-6 text-sm space-y-1">
              {analysis.sanity.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>

          {/* ボタン */}
          <section className="flex flex-wrap gap-3">
            <button type="button" onClick={onSave} disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              {saving ? '保存中…' : '保存'}
            </button>

            <button type="button" onClick={requestPublish} disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              {saving ? '申請中…' : '公開申請'}
            </button>
          </section>
        </>
      )}

      {msg && (
        <p className={`text-sm ${msgOk ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
      )}
    </div>
  );
}

/* ---- 小コンポーネント ---- */

function Num({
  label, val, onChange,
}: { label: string; val: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" value={val} onChange={onChange} />
    </label>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 rounded bg-gray-200">
        <div className="h-2 rounded bg-gray-800" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, val }: { label: string; val: number | string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-medium">{String(val)}</div>
    </div>
  );
}

function CardList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border p-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      {items?.length ? (
        <ul className="list-disc pl-6 text-sm space-y-1">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
      ) : (
        <p className="text-sm text-gray-500">—</p>
      )}
    </section>
  );
}
