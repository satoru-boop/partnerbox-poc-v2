'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const LS_SUBMIT = 'pb_submissions_v1';

export default function InvestorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SUBMIT);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      setData(arr.find((x) => String(x.id) === String(id)) || null);
    } catch {
      setData(null);
    }
  }, [id]);

  if (!id) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link href="/investor" className="text-sm text-blue-600 hover:underline">← 一覧に戻る</Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold">申請詳細</h1>
      <div className="mb-6 text-sm text-gray-600">ID: {id}</div>

      {!data ? (
        <p className="text-sm text-gray-500">データが見つかりませんでした（同一ブラウザの申請のみ参照可能）。</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded border p-4">
            <h2 className="mb-2 text-lg font-semibold">案件情報</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">案件名</div><div>{data.form?.title || '-'}</div>
              <div className="text-gray-600">要約</div><div>{data.form?.summary || '-'}</div>
              <div className="text-gray-600">業種</div><div>{data.form?.industry || '-'}</div>
              <div className="text-gray-600">フェーズ</div><div>{data.form?.phase || '-'}</div>
              <div className="text-gray-600">申請日時</div><div>{data.meta?.createdAt || '-'}</div>
            </div>
          </section>

          <section className="rounded border p-4">
            <h2 className="mb-2 text-lg font-semibold">PL・KPI</h2>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(data.form?.pl || {}).map(([k, v]) => (
                <li key={k} className="flex justify-between border-b py-1">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-medium">{String(v)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded border p-4">
            <h2 className="mb-2 text-lg font-semibold">AI解析</h2>
            {data.analysis?.metrics && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700">主要指標</h3>
                <ul className="space-y-1 text-sm">
                  {Object.entries(data.analysis.metrics).map(([k, v]) => (
                    <li key={k} className="flex justify-between rounded bg-gray-50 px-3 py-1">
                      <span className="text-gray-600">{k}</span>
                      <span className="font-medium">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.analysis?.advice && data.analysis.advice.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">アドバイス</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {data.analysis.advice.map((a: string, i: number) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
