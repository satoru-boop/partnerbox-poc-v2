// app/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ← Service Role を使う

// Server 側専用クライアント（RLS をまたいで update できる）
export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
  global: { fetch: fetch }, // Next.js runtime の fetch を利用
});
