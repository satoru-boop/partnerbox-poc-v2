// components/FounderEditor.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Founder = {
  id: string;
  title: string | null;
  company_name: string | null;
  industry: string | null;
  phase: string | null;
  revenue: number | null;
  ai_score: number | null;
  summary?: string | null;
};

export default function FounderEditor({ id, initial }: { id: string; initial: Founder }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial.title ?? '',
    company_name: initial.company_name ?? '',
    industry: initial.industry ?? '',
    phase: initial.phase ?? '',
    revenue: initial.revenue ?? ('' as any),
    ai_score: initial.ai_score ?? ('' as any),
    summary: initial.summary ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onChange =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: any = {
        title: form.title || null,
        company_name: form.company_name || null,
        industry: form.industry || null,
        phase: form.phase || null,
        summary: form.summary || null,
      };
      if (form.revenue !== '') payload.revenue = Number(form.revenue);
      if (form.ai_score !== '') payload.ai_score = Number(form.ai_score);

      const res = await fetch(`/api/fpl/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);
      setMsg('保存しました');
      // サーバーコンポーネントを再取得
      router.refresh();
    } catch (err: any) {
      setMsg(`保存に失敗: ${err.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="mt-8 rounded-2xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">編集</h2>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">案件名（title）</span>
          <input className="w-full rounded border px-3 py-2"
                 value={form.title} onChange={onChange('title')} />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">会社名（company_name）</span>
          <input className="w-full rounded border px-3 py-2"
                 value={form.company_name} onChange={onChange('company_name')} />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">業種（industry）</span>
          <input className="w-full rounded border px-3 py-2"
                 value={form.industry} onChange={onChange('industry')} />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">フェーズ（phase）</span>
          <input className="w-full rounded border px-3 py-2"
                 value={form.phase} onChange={onChange('phase')} />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">売上（revenue）</span>
          <input className="w-full rounded border px-3 py-2"
                 type="number" inputMode="numeric"
                 value={form.revenue as any} onChange={onChange('revenue')} />
        </label>

        <label className="text-sm">
          <span className="block text-gray-600 mb-1">AIスコア（ai_score）</span>
          <input className="w-full rounded border px-3 py-2"
                 type="number" inputMode="numeric"
                 value={form.ai_score as any} onChange={onChange('ai_score')} />
        </label>

        <label className="col-span-full text-sm">
          <span className="block text-gray-600 mb-1">概要（summary）</span>
          <textarea className="w-full rounded border px-3 py-2 h-24"
                    value={form.summary} onChange={onChange('summary')} />
        </label>
      </div>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </form>
  );
}
