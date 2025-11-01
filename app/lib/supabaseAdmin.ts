// /lib/supabaseAdmin.ts
import { createClient as createServerClient } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase env vars are missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createServerClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { 'x-application-name': 'partnerbox-poc' } },
  });
}
