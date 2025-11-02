// app/investors/[id]/page.tsx
type Props = { params: { id: string } };

async function fetchDetail(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/fpl/${id}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'fetch error');
  return json.data;
}

export default async function InvestorDetailPage({ params }: Props) {
  const data = await fetchDetail(params.id);

  const fields: Array<[string, any]> = [
    ['案件名', data.title],
    ['会社名', data.company_name],
    ['業種', data.industry],
    ['フェーズ', data.phase],
    ['売上', typeof data.revenue === 'number' ? data.revenue.toLocaleString() : '—'],
    ['粗利', typeof data.gross_profit === 'number' ? data.gross_profit.toLocaleString() : '—'],
    ['営業利益', typeof data.operating_income === 'number' ? data.operating_income.toLocaleString() : '—'],
    ['AIスコア', data.ai_score ?? '—'],
    ['作成日', new Date(data.created_at).toLocaleString('ja-JP')],
  ];

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <a href="/investor" className="text-sm text-blue-600 underline">← 一覧へ戻る</a>
        <h1 className="text-2xl font-bold">{data.title ?? data.company_name ?? data.id}</h1>
      </div>

      {/* 概要カード */}
      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 text-lg font-semibold">概要</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {data.summary ?? '（概要未入力）'}
        </p>
      </section>

      {/* メタ情報カード */}
      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 text-lg font-semibold">基本情報</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-900 text-right">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* タグ */}
      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 text-lg font-semibold">タグ</h2>
        <div className="flex flex-wrap gap-2">
          {(data.tags ?? []).length > 0 ? (
            data.tags.map((t: string, i: number) => (
              <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{t}</span>
            ))
          ) : (
            <span className="text-sm text-gray-500">（タグなし）</span>
          )}
        </div>
      </section>

      {/* JSON原文（デバッグ用） */}
      <details className="rounded-2xl border p-4 text-sm">
        <summary className="cursor-pointer select-none">RAW JSON</summary>
        <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </main>
  );
}
