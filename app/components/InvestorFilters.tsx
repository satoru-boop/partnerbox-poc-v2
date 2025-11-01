// components/InvestorFilters.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

export type Filters = {
  sort: 'ai_score' | 'created_at';
  order: 'asc' | 'desc';
  min_revenue?: number | null;
  max_revenue?: number | null;
  min_ai?: number | null;
  max_ai?: number | null;
  min_margin?: number | null;
  max_margin?: number | null;
  min_ope_margin?: number | null;
  max_ope_margin?: number | null;
  tags: string[];
  status: string[];
};

type Props = {
  value: Filters;
  onChange: (f: Filters) => void;
  // 候補（サーバから一度取得した distinct 値などを渡す設計も可能）
  tagOptions?: string[];
  statusOptions?: string[];
};

export default function InvestorFilters({
  value,
  onChange,
  tagOptions = [],
  statusOptions = [],
}: Props) {
  const [local, setLocal] = useState<Filters>(value);

  useEffect(() => setLocal(value), [value]);

  const push = (k: keyof Filters, v: any) => setLocal(prev => ({ ...prev, [k]: v }));

  const apply = () => onChange(local);

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border p-4 md:grid-cols-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">並び</label>
        <select
          className="select select-sm select-bordered"
          value={local.sort}
          onChange={e => push('sort', e.target.value as Filters['sort'])}
        >
          <option value="ai_score">AIスコア</option>
          <option value="created_at">登録日</option>
        </select>
        <select
          className="select select-sm select-bordered"
          value={local.order}
          onChange={e => push('order', e.target.value as Filters['order'])}
        >
          <option value="desc">降順</option>
          <option value="asc">昇順</option>
        </select>
      </div>

      <NumberRange
        label="売上(Revenue)"
        min={local.min_revenue}
        max={local.max_revenue}
        onMin={v => push('min_revenue', v)}
        onMax={v => push('max_revenue', v)}
      />

      <NumberRange
        label="AIスコア"
        min={local.min_ai}
        max={local.max_ai}
        onMin={v => push('min_ai', v)}
        onMax={v => push('max_ai', v)}
      />

      <NumberRange
        label="粗利率(%)"
        min={local.min_margin}
        max={local.max_margin}
        onMin={v => push('min_margin', v)}
        onMax={v => push('max_margin', v)}
      />

      <NumberRange
        label="営業利益率(%)"
        min={local.min_ope_margin}
        max={local.max_ope_margin}
        onMin={v => push('min_ope_margin', v)}
        onMax={v => push('max_ope_margin', v)}
      />

      <MultiSelect
        label="タグ"
        options={tagOptions}
        values={local.tags}
        onChange={(vals) => push('tags', vals)}
      />

      <MultiSelect
        label="ステータス"
        options={statusOptions}
        values={local.status}
        onChange={(vals) => push('status', vals)}
      />

      <div className="col-span-full flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={apply}>適用</button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            onChange({
              sort: 'ai_score',
              order: 'desc',
              min_revenue: null,
              max_revenue: null,
              min_ai: null,
              max_ai: null,
              min_margin: null,
              max_margin: null,
              min_ope_margin: null,
              max_ope_margin: null,
              tags: [],
              status: [],
            })
          }
        >
          クリア
        </button>
      </div>
    </div>
  );
}

function NumberRange({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min?: number | null;
  max?: number | null;
  onMin: (v: number | null) => void;
  onMax: (v: number | null) => void;
}) {
  const toNum = (s: string) => (s === '' ? null : Number(s));
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type="number"
        className="input input-sm input-bordered w-28"
        placeholder="min"
        value={min ?? ''}
        onChange={(e) => onMin(toNum(e.target.value))}
      />
      <span className="text-gray-400">–</span>
      <input
        type="number"
        className="input input-sm input-bordered w-28"
        placeholder="max"
        value={max ?? ''}
        onChange={(e) => onMax(toNum(e.target.value))}
      />
    </div>
  );
}

function MultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (v: string) =>
    values.includes(v) ? onChange(values.filter(x => x !== v)) : onChange([...values, v]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`badge cursor-pointer border ${values.includes(opt) ? 'badge-primary' : 'badge-ghost'}`}
            title={opt}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
