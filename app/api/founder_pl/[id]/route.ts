// /app/api/founder_pl/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const parsed = paramsSchema.safeParse(params);
   export async function GET(_req: Request, ctx: any) {
+   const params = ctx?.params ?? {};
+   const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('founder_pl')
    .select('*')
    .eq('id', parsed.data.id)
    .single();

  // PostgREST: PGRST116 = No rows found for single()
  if (error?.code === 'PGRST116' || (!data && !error)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
