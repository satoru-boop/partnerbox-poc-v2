// app/investors/[id]/page.tsx
import { headers } from 'next/headers';
import { createClient } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">取得エラー</h1>
        <p className="text-sm text-gray-700">{error.message}</p>
      </main>
    );
  }
  if (!data) return <main className="p-6">見つかりませんでした</main>;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      {/* 既存の基本情報カード（そのまま） */}
      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 text-lg font-semibold">基本情報</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="text-gray-500">{key}</dt>
              <dd className="text-gray-900 text-right">{String(value ?? '—')}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
