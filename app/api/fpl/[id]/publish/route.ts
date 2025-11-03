// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';

/** キャッシュさせない（念のため） */
export const dynamic = 'force-dynamic';

/**
 * Next.js 16 の正しいシグネチャ
 * 第二引数は { params: { id: string } } の形で受け取る
 */
export async function POST(
  _req: Request,
  context: { params: { id: string } }
) {
  const id = context.params?.id;
  if (!id) {
    return NextResponse.json(
      { error: { message: 'missing id' } },
      { status: 400 }
    );
  }

  // Supabase REST エンドポイントに PATCH
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: { message: 'Supabase 環境変数が未設定です' } },
      { status: 500 }
    );
  }

  const endpoint = `${url}/rest/v1/founder_pl?id=eq.${encodeURIComponent(id)}`;

  const resp = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      status: 'review', // 「審査中」へ
      submitted_at: new Date().toISOString(),
    }),
    // Next.js 16 の Edge/Node どちらでも動く
    cache: 'no-store',
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json(
      { error: { message: `Supabase update failed: ${resp.status} ${text}` } },
      { status: 500 }
    );
  }

  const rows = await resp.json();
  const updated = Array.isArray(rows) ? rows[0] : null;

  return NextResponse.json({
    message: '公開申請を受け付けました（審査中に移行）',
    data: updated ?? null,
  });
}
