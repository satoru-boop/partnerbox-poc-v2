// app/api/fpl/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const supabase = createClient();
  const { error } = await supabase
    .from('founder_pl')
    .update({
      status: 'review',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: '公開申請を受け付けました（審査中に移行）',
  });
}
