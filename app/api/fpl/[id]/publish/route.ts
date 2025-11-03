// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// （任意）Edge で不安定なら Node 実行を強制
export const runtime = 'nodejs';

export async function POST(_req: Request, context: any) {
  const id = context?.params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: { message: 'missing id' } }, { status: 400 });
  }

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
      status: 'review', // 審査中へ遷移
      submitted_at: new Date().toISOString(),
    }),
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
