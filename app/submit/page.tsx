// app/submit/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    company_name: '',
    industry: '',
    phase: '',
    revenue: '' as any,
    ai_score: '' as any,
    summary: '',
  });

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/fpl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          revenue: form.revenue === '' ? null : Number(form.revenue),
          ai_score: form.ai_score === '' ? null : Number(form.ai_score),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `status ${res.status}`);
      const id = json?.data?.id as string;
      router.push(`/investors/${id}`);
    } catch (err: any) {
      setMsg(`保存に失敗: ${err.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Founder_PL 登録</h1>

      <form onSubmit={onSave} className="rounded-2xl border p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">案件名（title）</span>
            <input className="w-full rounded border px-3 py-2" value={form.title} onChange={onChange('title')} />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">会社名（company_name）</span>
            <input className="w-full rounded border px-3 py-2" value={form.company_name} onChange={onChange('company_name')} />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">業種（industry）</span>
            <input className="w-full rounded border px-3 py-2" value={form.industry} onChange={onChange('industry')} />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">フェーズ（phase）</span>
            <input className="w-full rounded border px-3 py-2" value={form.phase} onChange={onChange('phase')} />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">売上（revenue）</span>
            <input className="w-full rounded border px-3 py-2" type="number" inputMode="numeric" value={form.revenue as any} onChange={onChange('revenue')} />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">AIスコア（ai_score）</span>
            <input className="w-full rounded border px-3 py-2" type="number" inputMode="numeric" value={form.ai_score as any} onChange={onChange('ai_score')} />
          </label>
          <label className="col-span-full text-sm">
            <span className="block text-gray-600 mb-1">概要（summary）</span>
            <textarea className="w-full rounded border px-3 py-2 h-24" value={form.summary} onChange={onChange('summary')} />
          </label>
        </div>

        <button type="submit" disabled={saving} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60">
          {saving ? '保存中…' : '保存して詳細へ'}
        </button>

        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </form>
    </main>
  );
}
