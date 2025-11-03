'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function FormClient() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // フォーム送信（FormData → /api/fpl へ保存 → /investors/:id へ）
  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const fd = new FormData(e.currentTarget);

      // 値取得（最初に見つかったキーを採用）
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
    <form onSubmit={onSave} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>

      <div className="rounded-2xl border p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* /submit のUIをそのまま反映（制御状態→非制御 に変更、name を付与） */}
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

          {/* 任意：タグを使う場合は残す（使わないならこのブロックは削除可） */}
          <label className="col-span-full text-sm">
            <span className="block text-gray-600 mb-1">タグ（カンマ区切り可 / 任意）</span>
            <input name="tags" className="w-full rounded border px-3 py-2" placeholder="例）SaaS, 医療, D2C" />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存して投資家プレビューへ'}
        </button>

        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </div>
    </form>
  );
}
