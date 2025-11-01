'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const LS_SUBMIT = 'pb_submissions_v1';

export default function InvestorListPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SUBMIT);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">投資家：申請一覧（PoC）</h1>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          まだ申請がありません。起業家画面で「申請する」を実行してください。
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((x) => (
            <li key={x.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{x.form?.title || '(無題案件)'}</div>
                  <div className="text-gray-500">{x.meta?.createdAt}</div>
                  <div className="text-gray-500">ID: {x.id}</div>
                </div>
                <Link className="rounded bg-black px-3 py-1 text-sm text-white" href={`/investor/${encodeURIComponent(x.id)}`}>
                  詳細を見る
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-gray-500">
        ※ PoC：同一ブラウザの localStorage に保存された申請のみ表示されます。
      </p>
    </main>
  );
}
