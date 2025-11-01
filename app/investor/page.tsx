// /app/investor/page.tsx
'use client';

import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InvestorListPage() {
  const { data, error, isLoading } = useSWR('/api/founder_pl?page=1&pageSize=50', fetcher);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        データ取得に失敗しました: {String(error.message || error)}
      </div>
    );
  }

  const list = data?.items ?? [];

  if (!Array.isArray(list) || list.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">データがありません。</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-6">投資家リスト</h1>

      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">会社名</th>
            <th className="border px-3 py-2 text-left">AIスコア</th>
            <th className="border px-3 py-2 text-left">売上</th>
            <th className="border px-3 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x: any) => (
            <tr key={x.id ?? Math.random()} className="border-t">
              <td className="border px-3 py-2">{x.company_name ?? '—'}</td>
              <td className="border px-3 py-2">{x.ai_score ?? '—'}</td>
              <td className="border px-3 py-2">{x.revenue?.toLocaleString?.() ?? '—'}</td>
              <td className="border px-3 py-2">
                {typeof x.id === 'string' && x.id ? (
                  <Link
                    className="rounded bg-black px-3 py-1 text-sm text-white"
                    href={`/investors/${encodeURIComponent(x.id)}`}
                    prefetch={false}
                    title={x.id} // デバッグ用
                  >
                    詳細を見る
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-600 cursor-not-allowed"
                    aria-disabled
                    title="IDが未設定のため遷移できません"
                  >
                    詳細を見る
                  </button>
                )}
                <span className="ml-2 text-xs text-gray-500">
                  id: {String(x?.id ?? '—')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
