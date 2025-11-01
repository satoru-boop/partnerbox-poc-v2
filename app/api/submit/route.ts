// app/api/submit/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // 簡易な受付ID（時刻 + ランダム4桁）
  const id = `PB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 将来：ここでDB保存（Supabase/Firestore 等）に差し替え
  return NextResponse.json({
    ok: true,
    id,
    receivedAt: new Date().toISOString(),
    echo: body,
  });
}
