// /app/investors/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function getFounder(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function InvestorDetailPage({ params }: { params: { id: string } }) {
  const founder = await getFounder(params.id);
  if (!founder) notFound();

  const grossMargin =
    founder.revenue && founder.gross_profit
      ? ((founder.gross_profit / founder.revenue) * 100).toFixed(1)
      : null;
  const operatingMargin =
    founder.revenue && founder.operating_income
      ? ((founder.operating_income / founder.revenue) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <Link href="/investors" className="text-sm text-muted-foreground hover:underline">
        ← 一覧へ戻る
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">{founder.company_name ?? '—'}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="AIスコア" value={founder.ai_score} />
        <KpiCard label="売上" value={founder.revenue?.toLocaleString()} />
        <KpiCard label="粗利率" value={grossMargin ? `${grossMargin}%` : '—'} />
        <KpiCard label="営業利益率" value={operatingMargin ? `${operatingMargin}%` : '—'} />
        <KpiCard label="作成日" value={new Date(founder.created_at).toLocaleDateString()} />
      </div>

      {founder.tags?.length ? (
        <div className="flex flex-wrap gap-2 mt-4">
          {founder.tags.map((tag: string) => (
            <span key={tag} className="rounded-full border px-3 py-1 text-xs bg-white/60">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/50">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value ?? '—'}</div>
    </div>
  );
}
