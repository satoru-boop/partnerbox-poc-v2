// app/components/InvestorTable.tsx
'use client';

import { useMemo, useState } from 'react';
// ❌ import { downloadCSV, toCSV } from '@/utils/csv';
// ✅
import { downloadCSV, toCSV } from '../../utils/csv';


export type InvestorRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  ai_score: number | null;
  tags: string[] | null;
  status: string | null;
  // derived
  grossMargin?: number | null;
  operatingMargin?: number | null;
};

export default function InvestorTable({
  rows,
  compact = true,
}: {
  rows: InvestorRow[];
  compact?: boolean;
}) {
  const [mode, setMode] = useState<'compact' | 'comfortable'>(compact ? 'compact' : 'comfortable');

  const headers = [
    'id',
    'company_name',
    'created_at',
    'revenue',
    'gross_profit',
    'operating_income',
    'grossMargin(%)',
    'operatingMargin(%)',
    'ai_score',
    'tags',
    'status',
  ];

  const dataForCsv = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        company_name: r.company_name ?? '',
        created_at: r.created_at ?? '',
        revenue: fmtNum(r.revenue),
        gross_profit: fmtNum(r.gross_profit),
        operating_income: fmtNum(r.operating_income),
        'grossMargin(%)': fmtPct(r.grossMargin),
        'operatingMargin(%)': fmtPct(r.operatingMargin),
        ai_score: fmtNum(r.ai_score),
        tags: (r.tags ?? []).join('|'),
        status: r.status ?? '',
      })),
    [rows]
  );

  const exportCSV = () => {
    const csv = toCSV(dataForCsv, headers);
    downloadCSV(`founder_pl_${Date.now()}.csv`, csv);
  };

  const rowPad = mode === 'compact' ? 'py-1' : 'py-3';

  return (
    <div className="rounded-2xl border">
      <div className="flex items-center justify-between p-3">
        <div className="text-sm text-gray-500">
          {rows.length.toLocaleString()} 件
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={exportCSV}>CSVエクスポート</button>
          <div className="join">
            <button
              className={`btn btn-sm join-item ${mode === 'compact' ? 'btn-active' : ''}`}
              onClick={() => setMode('compact')}
              title="詰めて表示"
            >
              Compact
            </button>
            <button
              className={`btn btn-sm join-item ${mode === 'comfortable' ? 'btn-active' : ''}`}
              onClick={() => setMode('comfortable')}
              title="ゆったり表示"
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <Th>会社名</Th>
              <Th>AIスコア</Th>
              <Th>売上</Th>
              <Th>粗利</Th>
              <Th>粗利率</Th>
              <Th>営業利益</Th>
              <Th>営業利益率</Th>
              <Th>ステータス</Th>
              <Th>タグ</Th>
              <Th>登録日</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={rowPad}>
                <td className="whitespace-nowrap">
                  <div className="font-medium">{r.company_name ?? '-'}</div>
                  <div className="text-xs text-gray-400">{r.id}</div>
                </td>
                <td>{n(r.ai_score)}</td>
                <td>{n(r.revenue)}</td>
                <td>{n(r.gross_profit)}</td>
                <td>{pct(r.grossMargin)}</td>
                <td>{n(r.operating_income)}</td>
                <td>{pct(r.operatingMargin)}</td>
                <td>{r.status ?? '-'}</td>
                <td className="max-w-[260px] truncate" title={(r.tags ?? []).join(', ')}>
                  {(r.tags ?? []).join(', ')}
                </td>
                <td className="whitespace-nowrap text-xs text-gray-500">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</th>;
}

function n(v: number | null | undefined) {
  return typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString() : '-';
}
function pct(v: number | null | undefined) {
  return typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(1)}%` : '-';
}
function fmtNum(v: number | null | undefined) {
  return typeof v === 'number' && Number.isFinite(v) ? v : '';
}
function fmtPct(v: number | null | undefined) {
  return typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(2)) : '';
}
