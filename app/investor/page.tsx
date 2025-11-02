'use client';

import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((r) => r.json());

export default function InvestorListPage() {
  // まずは固定で 1 ページ目を出す
  const { data, error, isLoading } = useSWR(
    '/api/fpl?page=1&pageSize=10',
    fetcher
  );

  if (isLoading) return <main className="p-6">読み込み中...</main>;
  if (error) return <main className="p-6">読み込みエラー: {String(error)}</main>;

  // APIの形: { data: [...], page, pageSize, total, totalPages }
  const rows = Array.isArray(data?.data) ? data.data : [];

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Founder_PL 一覧</h1>

      <div className="text-sm text-gray-500">
        page {data?.page ?? '-'} / size {data?.pageSize ?? '-'} / total {data?.total ?? '-'}
      </div>

      {rows.length === 0 ? (
        <div>データがありません</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r: any) => (
            <li key={r.id}>
              <a className="text-blue-600 underline" href={`/investors/${r.id}`}>
                {r.title ?? r.company_name ?? r.id}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
