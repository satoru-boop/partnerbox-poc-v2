// components/InvestorTable.tsx
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

function fmtNum(n: number | null | undefined) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString('ja-JP');
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso ?? '—';
  }
}

export default function InvestorTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
            <th className="w-[32%]">案件名 / 会社名</th>
            <th className="w-[10%]">業種</th>
            <th className="w-[10%]">フェーズ</th>
            <th className="w-[10%] text-right">売上高</th>
            <th className="w-[8%] text-center">AIスコア</th>
            <th className="w-[18%]">作成日</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => {
            const title = r.title ?? '（未入力）';
            const company = r.company_name ?? '会社なし';
            return (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <a href={`/investors/${r.id}`} className="font-medium text-blue-700 underline underline-offset-2">
                    {title}
                  </a>
                  <div className="text-[12px] text-gray-500 mt-0.5">{company}</div>
                  <div className="text-[11px] text-gray-400">ID: {r.id}</div>
                </td>
                <td className="px-4 py-3">{r.industry ?? '—'}</td>
                <td className="px-4 py-3">{r.phase ?? '—'}</td>
                <td className="px-4 py-3 text-right">{fmtNum(r.revenue)}</td>
                <td className="px-4 py-3">
                  <div className="mx-auto inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-0.5 text-xs text-gray-700">
                    {typeof r.ai_score === 'number' ? r.ai_score : '—'}
                  </div>
                </td>
                <td className="px-4 py-3">{fmtDate(r.created_at)}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                データがありません。右上の「登録」から追加してください。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
