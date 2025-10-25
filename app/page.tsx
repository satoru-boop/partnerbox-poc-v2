'use client'
import React, { useState } from 'react'

type Role = 'founder' | 'investor' | 'admin'
type Startup = {
  id: string
  title: string
  summary: string
  industry: string
  phase: string
  pl: {
    revenue: number
    cogs: number
    adCost: number
    fixedCost: number
    cv: number
    price: number
    cvr: number
    cpa: number
    ltv: number
    churn: number
  }
  status: 'draft' | 'review' | 'public'
  score?: Scores & { band: string }
  insights?: Insights
}

type Scores = { total: number; finance: number; viability: number; gtm: number; risk: number }
type Insights = { strengths: string[]; risks: string[]; actions: string[]; checks: string[] }

function calcScores(pl: Startup['pl']): { scores: Scores & { band: string }; insights: Insights } {
  const r = Number(pl.revenue || 0)
  const cogs = Number(pl.cogs || 0)
  const ad = Number(pl.adCost || 0)
  const fx = Number(pl.fixedCost || 0)
  const cv = Number(pl.cv || 0)
  const price = Number(pl.price || 0)
  const cvr = Number(pl.cvr || 0)
  const cpa = Number(pl.cpa || 0)
  const ltv = Number(pl.ltv || 0)
  const churn = Number(pl.churn || 0)

  const gross = r - cogs
  const op = r - cogs - ad - fx
  const gm = r > 0 ? (gross / r) * 100 : 0
  const adRate = r > 0 ? (ad / r) * 100 : 0
  const opm = r > 0 ? (op / r) * 100 : -50
  const ltvCac = cpa > 0 ? ltv / cpa : 0
  const expected = price * cv
  const cons = expected > 0 ? Math.max(0, 100 - (Math.abs(r - expected) / expected) * 100) : 50

  let finance = 70
  finance += Math.min(15, (gm - 40) * 0.4)
  finance -= Math.max(0, (adRate - 40) * 0.6)
  finance += (cons - 70) * 0.3
  finance = clamp(finance)

  let viability = 65
  viability += opm * 0.4
  viability -= Math.max(0, (fx / Math.max(1, r) - 0.25) * 60)
  viability = clamp(viability)

  let gtm = 60
  gtm += Math.min(20, (cvr - 1) * 4)
  gtm += Math.min(20, (ltvCac - 2.0) * 10)
  gtm = clamp(gtm)

  let risk = 85
  risk -= Math.max(0, (churn - 3) * 3)
  risk = clamp(risk)

  const total = Math.round(finance * 0.35 + viability * 0.25 + gtm * 0.25 + risk * 0.15)
  const band = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D'

  const strengths: string[] = []
  const risks: string[] = []
  const actions: string[] = []
  if (gm >= 60) strengths.push('粗利率が高くコスト構造が良好です')
  if (ltvCac >= 3) strengths.push('LTV/CAC ≥ 3.0 でユニットエコノミクス良好')
  if (cons >= 90) strengths.push('売上=CV×単価 の整合性が高い')

  if (adRate > 45) risks.push('広告費比率が45%を超過')
  if (cons < 70) risks.push('売上=CV×単価 とPLに乖離あり')
  if (churn > 5) risks.push('解約率5%/月超で継続収益に懸念')

  if (ltvCac < 2) actions.push('LTV向上（継続率・単価）またはCAC削減（CVR改善）に注力')
  if (adRate > 40) actions.push('広告費率の上限を40%にルール化')
  if (cons < 85) actions.push('CV・単価・売上の定義を見直し、算式を統一')
  if (opm < 0) actions.push('固定費/原価の見直しで営業黒字化の道筋を明確化')

  const checks = [
    `売上: ${r.toLocaleString()} / 期待売上(CV×単価): ${expected.toLocaleString()} / 整合性: ${Math.round(cons)}%`,
    `粗利率: ${Math.round(gm)}% / 広告費率: ${Math.round(adRate)}% / 営業利益率: ${Math.round(opm)}%`,
    `LTV/CAC: ${ltvCac.toFixed(2)} / 解約率(月次): ${churn}%`,
  ]

  return { scores: { total, finance, viability, gtm, risk, band }, insights: { strengths, risks, actions, checks } }
}
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

const INDUSTRIES = ['SaaS', 'D2C', 'Marketplace', 'Fintech', 'Other']
const PHASES = ['Pre', 'Seed', 'Series A']

// ✅ Next.js 16 の Page 型に合わせた宣言
export default function Page(
  _props: {
    params: Record<string, string>
    searchParams?: Record<string, string | string[]>
  }
): JSX.Element {
  const [role, setRole] = useState<Role>('founder')
  const [draft, setDraft] = useState<Startup>({
    id: 'TMP',
    title: '',
    summary: '',
    industry: INDUSTRIES[0],
    phase: PHASES[0],
    pl: { revenue: 0, cogs: 0, adCost: 0, fixedCost: 0, cv: 0, price: 0, cvr: 0, cpa: 0, ltv: 0, churn: 0 },
    status: 'draft',
  })
  const [analysis, setAnalysis] = useState<{ scores: Scores & { band: string }; insights: Insights } | null>(null)
  const [list, setList] = useState<Startup[]>(seed())

  const doAnalyze = () => setAnalysis(calcScores(draft.pl))
  const publish = () => {
    if (!analysis) return
    const id = `S${String(list.length + 1).padStart(3, '0')}`
    setList([{ ...draft, id, status: 'review', score: analysis.scores, insights: analysis.insights }, ...list])
    setDraft({
      id: 'TMP',
      title: '',
      summary: '',
      industry: INDUSTRIES[0],
      phase: PHASES[0],
      pl: { revenue: 0, cogs: 0, adCost: 0, fixedCost: 0, cv: 0, price: 0, cvr: 0, cpa: 0, ltv: 0, churn: 0 },
      status: 'draft',
    })
    setAnalysis(null)
    setRole('investor')
    alert('公開申請しました（運営承認待ち）')
  }
  const approve = (id: string) => setList(list.map((s) => (s.id === id ? { ...s, status: 'public' } : s)))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold">Partner Box — PoC Mock（詳細版）</h1>
        <nav className="space-x-2 text-sm">
          {(['founder', 'investor', 'admin'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded ${role === r ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {r === 'founder' ? '起業家' : r === 'investor' ? '投資家' : '運営'}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {role === 'founder' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="案件の基本情報">
              <div className="space-y-3">
                <Input label="案件名" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
                <Input label="30字要約" value={draft.summary} onChange={(v) => setDraft({ ...draft, summary: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="業種"
                    value={draft.industry}
                    onChange={(v) => setDraft({ ...draft, industry: v })}
                    options={INDUSTRIES}
                  />
                  <Select
                    label="フェーズ"
                    value={draft.phase}
                    onChange={(v) => setDraft({ ...draft, phase: v })}
                    options={PHASES}
                  />
                </div>
              </div>
            </Card>

            <Card title="PL・KPI（簡易）">
              <div className="grid grid-cols-2 gap-3">
                {[
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
                ].map(([label, key]) => (
                  <NumberInput
                    key={key}
                    label={label}
                    value={(draft.pl as any)[key]}
                    onChange={(v) => setDraft({ ...draft, pl: { ...draft.pl, [key as string]: v } })}
                  />
                ))}
              </div>
              <div className="pt-3">
                <button onClick={doAnalyze} className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-black">
                  AI解析する
                </button>
              </div>
            </Card>

            {analysis && (
              <>
                <Card title="AI解析スコア">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold">{analysis.scores.total}</div>
                    <Badge>{`ランク ${analysis.scores.band}`}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Score label="Finance Fit" value={analysis.scores.finance} />
                    <Score label="Viability" value={analysis.scores.viability} />
                    <Score label="Go-To-Market" value={analysis.scores.gtm} />
                    <Score label="Risk" value={analysis.scores.risk} />
                  </div>
                </Card>
                <Card title="強み">
                  <List items={analysis.insights.strengths} empty="該当なし" />
                </Card>
                <Card title="リスク">
                  <List items={analysis.insights.risks} empty="該当なし" />
                </Card>
                <Card title="改善提案">
                  <List items={analysis.insights.actions} empty="該当なし" />
                </Card>
                <Card title="整合性チェック">
                  <List items={analysis.insights.checks} empty="-" />
                </Card>

                <Card title="次のアクション">
                  <div className="flex gap-2">
                    <button onClick={() => setAnalysis(null)} className="px-4 py-2 rounded border">
                      修正して再解析
                    </button>
                    <button onClick={publish} className="px-4 py-2 rounded bg-blue-600 text-white">
                      公開申請
                    </button>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {role === 'investor' && <Investor list={list} />}
        {role === 'admin' && <Admin list={list} onApprove={approve} />}
      </main>
      <footer className="text-xs text-center text-gray-500 py-8">PoC Mock — ローカル状態のみで動作</footer>
    </div>
  )
}

function Investor({ list }: { list: Startup[] }) {
  const [min, setMin] = useState(0)
  const pubs = list.filter((s) => s.status === 'public' && (s.score ? s.score.total >= min : true))
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">案件リスト</h2>
        <div className="flex-1" />
        <label className="text-xs">最低スコア</label>
        <input value={min} onChange={(e) => setMin(Number(e.target.value))} type="number" className="border px-2 py-1 rounded w-24" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {pubs.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-semibold">{s.title || s.id}</div>
              {s.score && <Badge>{`Score ${s.score.total}`}</Badge>}
              <Badge>{s.industry}</Badge>
              <Badge>{s.phase}</Badge>
            </div>
            <p className="text-sm text-gray-700 mb-3">{s.summary || '—'}</p>
            <button onClick={() => alert(`「関心あり」を送りました（案件:${s.id}）`)} className="px-3 py-1.5 rounded bg-yellow-500 text-white text-sm">
              関心あり
            </button>
          </div>
        ))}
        {!pubs.length && <div className="text-sm text-gray-500">該当する案件がありません</div>}
      </div>
    </div>
  )
}

function Admin({ list, onApprove }: { list: Startup[]; onApprove: (id: string) => void }) {
  const review = list.filter((s) => s.status === 'review')
  const pub = list.filter((s) => s.status === 'public')
  return (
    <div className="space-y-6">
      <Card title="公開待ち">
        {!review.length && <div className="text-sm text-gray-500">現在、公開待ちはありません</div>}
        {review.map((s) => (
          <div key={s.id} className="flex items-center gap-3 border rounded-xl p-3">
            <div className="font-medium">{s.title || s.id}</div>
            {s.score && <Badge>{`Score ${s.score.total}`}</Badge>}
            <div className="flex-1" />
            <button onClick={() => onApprove(s.id)} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">
              承認
            </button>
          </div>
        ))}
      </Card>
      <Card title="公開中">
        <div className="grid md:grid-cols-2 gap-3">
          {pub.map((s) => (
            <div key={s.id} className="border rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="font-medium">{s.title || s.id}</div>
                {s.score && <Badge>{`Score ${s.score.total}`}</Badge>}
                <Badge>{s.industry}</Badge>
                <Badge>{s.phase}</Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">ID: {s.id}</div>
            </div>
          ))}
          {!pub.length && <div className="text-sm text-gray-500">公開中の案件はありません</div>}
        </div>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="text-sm text-gray-700 space-y-3">{children}</div>
    </div>
  )
}

function List({ items, empty }: { items: string[]; empty: string }) {
  const has = items && items.length > 0
  if (!has) return <div className="text-sm text-gray-500">{empty}</div>
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">{children}</span>
}

function Score({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-2 ${tone} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border w-full px-3 py-2" />
    </label>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-xl border w-full px-3 py-2" />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="block">
      <span className="text-xs">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border w-full px-3 py-2">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function seed(): Startup[] {
  return [
    {
      id: 'A',
      title: 'SaaS美容予約',
      summary: '美容サロン向け予約SaaS。チャーン3%/月、LTV/CAC=3.2',
      industry: 'SaaS',
      phase: 'Seed',
      pl: {
        revenue: 1200000,
        cogs: 450000,
        adCost: 250000,
        fixedCost: 200000,
        cv: 800,
        price: 2000,
        cvr: 2.5,
        cpa: 2000,
        ltv: 6400,
        churn: 3,
      },
      status: 'public',
      ...calcScores({
        revenue: 1200000,
        cogs: 450000,
        adCost: 250000,
        fixedCost: 200000,
        cv: 800,
        price: 2000,
        cvr: 2.5,
        cpa: 2000,
        ltv: 6400,
        churn: 3,
      }),
    },
    {
      id: 'B',
      title: 'D2C食品',
      summary: '健康志向スナックのD2C。広告比率45%、解約6%/月',
      industry: 'D2C',
      phase: 'Pre',
      pl: {
        revenue: 900000,
        cogs: 420000,
        adCost: 400000,
        fixedCost: 150000,
        cv: 1500,
        price: 500,
        cvr: 1.2,
        cpa: 900,
        ltv: 1200,
        churn: 6,
      },
      status: 'public',
      ...calcScores({
        revenue: 900000,
        cogs: 420000,
        adCost: 400000,
        fixedCost: 150000,
        cv: 1500,
        price: 500,
        cvr: 1.2,
        cpa: 900,
        ltv: 1200,
        churn: 6,
      }),
    },
  ] as unknown as Startup[]
}
