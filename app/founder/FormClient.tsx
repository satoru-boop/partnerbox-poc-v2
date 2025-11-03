'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function FormClient() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // ---- 共通ヘルパ（フォームから値を吸い上げ / 書き戻し） ----
  const read = (name: string) => {
    const f = formRef.current!;
    const el = f.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    return el ? el.value : '';
  };
  const write = (name: string, v: string | number | null | undefined) => {
    const f = formRef.current!;
    const el = f.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!el) return;
    el.value = v == null ? '' : String(v);
  };

  // ---- AI解析：現在のフォーム値を /api/analyze へ送り、結果を書き戻す ----
  async function onAnalyze() {
    setAnalyzing(true);
    setMsg(null);
    try {
      const payload = {
        title: read('title'),
        company_name: read('company_name'),
        industry: read('industry'),
        phase: read('phase'),
        revenue: read('revenue') ? Number(read('revenue')) : null,
        summary: read('summary'),
        tags: read('tags'),
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);

      // 期待する返却例：{ ai_score: number, summary: string, ... }
      if (json?.ai_score != null) write('ai_score', json.ai_score);
      if (json?.summary) write('summary', json.summary);
      setMsg('AI解析を反映しました。');
    } catch (err: any) {
      setMsg(`AI解析に失敗：${err?.message ?? String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // ---- 保存：/api/fpl へ保存 → /investors/:id へ ----
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
        title:        pick(['title']),
        company_name: pick(['company_name']),
        industry:     pick(['industry']),
        phase:        pick(['phase']),
        revenue:      pick(['revenue'], true),
        ai_score:     pick(['ai_score'], true),
        summary:      pick(['summary']),
        tags:         pick(['tags']) ?? '',
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
    <form ref={formRef} onSubmit={onSave} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>
      <p className="text-sm text-gray-600">
        入力して<strong>AI解析する</strong>で要約・スコアを自動補完し、<strong>保存</strong>で投資家プレビュー（/investors/:id）に遷移します。
      </p>

      <div className="rounded-2xl border p-5 space-y-4">
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
            <span className="block text-gray-600 mb-1">タグ（カンマ区切り可 / 任意）</span>
            <input name="tags" className="w-full rounded border px-3 py-2" placeholder="例）SaaS, 医療, D2C" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing}
            className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {analyzing ? 'AI解析中…' : 'AI解析する'}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? '保存中…' : '保存して投資家プレビューへ'}
          </button>
        </div>

        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </div>
    </form>
  );
}
