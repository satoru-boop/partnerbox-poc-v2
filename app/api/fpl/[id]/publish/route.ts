import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseAdmin';

// POST /api/fpl/:id/publish
export async function POST(_req: Request, { params }: any) {
  const id = params?.id as string;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createClient();

  // status を review（審査中）に更新
  const { error } = await supabase
    .from('founder_pl')
    .update({ status: 'review' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}
