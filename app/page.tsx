// app/page.tsx  ← サーバーコンポーネント（"use client" は書かない）
export const dynamic = 'force-dynamic'; // 必要ならこれだけ残す（キャッシュ無効化）

import PageClient from './PageClient';

export default function Page() {
  return <PageClient />;
}
