// app/founder/FormClient.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function FormClient() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // フォームの read / write ヘルパ
  const read = (name: string) =>
    (formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? '';

  const write = (name: string, val: string | number) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = String(val);
  };

  // === AI解析ボタン ===
  async function onAnalyze(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setAnalyzing(true);
    setMsg(null);

    try {
      // 既存UIに存在しない数値は 0 で埋める
      const form = {
        title: read('title'),
        company_name: read('company_name'),
        summary: read('summary'),
        industry: read('industry'),
        phase: read('phase'),
        pl: {
          revenue: Number(read('revenue') || 0),
          cogs: Number(read('cogs') || 0),
          fixedCost: Number(read('fixed_cost') || 0),
          adCost: Number(read('ad_cost') || 0),
          cv: Number(read('cv') || 0),
          cvr: Number(read('cvr') || 0),
          price: Number(read('price') || 0),
          cpa: Number(read('cpa') || 0),
          ltv: Number(read('ltv') || 0),
          churn: Number(read('churn') || 0),
        },
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form }),
      });
      const json = await res.json();

      // 解析結果をフォームへ反映
      if (json?.ai_score != null) write('ai_score', json.ai_score);
      if (!read('summary') && json?.summary) write('summary', json.summary);

      const g = json?.kpi?.grossMargin;
      const l = json?.kpi?.ltvToCac;
      setMsg(`✅ 解析完了: 粗利率 ${g ?? '-'}% / LTV-CAC ${l ?? '-'}`);
    } catch (err: any) {
      setMsg(`解析に失敗: ${err?.message ?? String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // === 保存（/api/fpl → /investors/:id） ===
  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const fd = new FormData(e.currentTarget);

      const pick = (keys: string[], coerceNumber = false) => {
        for (const k of keys) {
          const v = fd.get(k);
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            return coerceNumber ? Number(v) : String(v);
          }
        }
        return null;
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
      setMsg(`保存に失敗: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSave} className="rounded-2xl border p-5 space-y-4">
      {/* ここは“前のUI”そのまま。name 属性だけ一致させてください */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">案件名（title）</span>
          <input name="title" className="w-full rounded border px-3 py-2" placeholder="例）ヘルスケアSaaS A" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">会社名（company_name）</span>
          <input name="company_name" className="w-full rounded border px-3 py-2" placeholder="例）株式会社○○" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">業種（industry）</span>
          <input name="industry" className="w-full rounded border px-3 py-2" placeholder="例）SaaS / 医療" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">フェーズ（phase）</span>
          <input name="phase" className="w-full rounded border px-3 py-2" placeholder="例）Seed / Series A" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">売上（revenue）</span>
          <input name="revenue" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" placeholder="例）1200000" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">AIスコア（ai_score）</span>
          <input name="ai_score" type="number" inputMode="numeric" className="w-full rounded border px-3 py-2" placeholder="例）65" />
        </label>
        <label className="col-span-full text-sm">
          <span className="block text-gray-600 mb-1">概要（summary）</span>
          <textarea name="summary" className="w-full rounded border px-3 py-2 h-24" placeholder="事業概要や補足事項を記入" />
        </label>
        <label className="col-span-full text-sm">
          <span className="block text-gray-600 mb-1">タグ（tags｜カンマ区切り可）</span>
          <input name="tags" className="w-full rounded border px-3 py-2" placeholder="例）SaaS, 医療, D2C" />
        </label>
      </div>

      {/* 旧UIに無いKPI入力は hidden でOK（ゼロ埋め用） */}
      <input type="hidden" name="cogs" />
      <input type="hidden" name="fixed_cost" />
      <input type="hidden" name="ad_cost" />
      <input type="hidden" name="cv" />
      <input type="hidden" name="cvr" />
      <input type="hidden" name="price" />
      <input type="hidden" name="cpa" />
      <input type="hidden" name="ltv" />
      <input type="hidden" name="churn" />

      <div className="flex gap-3">
        <button onClick={onAnalyze} disabled={analyzing} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {analyzing ? 'AI解析中…' : 'AI解析する'}
        </button>
        <button type="submit" disabled={saving} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {saving ? '保存中…' : '保存して投資家プレビューへ'}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </form>
  );
}
