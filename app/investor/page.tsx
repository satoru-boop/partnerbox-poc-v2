'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

type Row = {
  id: string;
  title: string | null;
  company_name: string | null;
  industry: string | null;
  phase: string | null;
  revenue: number | null;
  ai_score: number | null;
  created_at: string;
};

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());

export default function InvestorListPage() {
  // ページングのローカル状態
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const apiUrl = useMemo(() => `/api/fpl?page=${page}&pageSize=${pageSize}`, [page]);

  const { data, error, isLoading } = useSWR(apiUrl, fetcher);

  const rows: Row[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 0;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // 見出しテキストの整形
  const subtitle = `page ${page} / ${Math.max(totalPages, 1)} | total ${total}`;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Founder_PL 一覧</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>

        {/* 操作バー */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-md border text-sm ${canPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            disabled={!canPrev}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← 前へ
          </button>
          <button
            className={`px-3 py-1.5 rounded-md border text-sm ${canNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            disabled={!canNext}
            onClick={() => setPage(p => p + 1)}
          >
            次へ →
          </button>

          <span className="ml-auto text-xs text-gray-500">
            1ページ {pageSize} 件表示
          </span>
        </div>
      </header>

      {/* ローディング／エラー表示 */}
      {isLoading && <SkeletonTable />}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          読み込みエラー: {String(error)}
        </div>
      )}

      {/* テーブル */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <Th>ID</Th>
                <Th>案件名 / 会社名</Th>
                <Th>業種</Th>
                <Th>フェーズ</Th>
                <Th className="text-right">売上</Th>
                <Th className="text-right">AIスコア</Th>
                <Th>作成日</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              )}

              {rows.map((r) => {
                const name = r.title ?? r.company_name ?? '（未入力）';
                const industry = r.industry ?? '—';
                const phase = r.phase ?? '—';
                const revenue = typeof r.revenue === 'number' ? r.revenue : null;
                const score = typeof r.ai_score === 'number' ? r.ai_score : null;

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td>
                      <a href={`/investors/${r.id}`} className="text-blue-600 underline break-all">
                        {r.id}
                      </a>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        {r.title === null && (
                          <Badge>no title</Badge>
                        )}
                        {r.company_name === null && (
                          <Badge>no company</Badge>
                        )}
                      </div>
                    </Td>
                    <Td>{industry}</Td>
                    <Td>{phase}</Td>
                    <Td className="text-right">
                      {revenue !== null ? revenue.toLocaleString() : '—'}
                    </Td>
                    <Td className="text-right">
                      {score !== null ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs ${
                            score >= 70
                              ? 'bg-green-100 text-green-700'
                              : score >= 40
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {score}
                        </span>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      {new Date(r.created_at).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

/* ------- 小さなUIコンポーネント（同ファイル内） ------- */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{children}</span>;
}
function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 border-b bg-gray-50/50" />
        ))}
      </div>
    </div>
  );
}
