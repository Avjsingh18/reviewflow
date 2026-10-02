import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseAdmin() {
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function supabasePublic() {
  if (!url) throw new Error("Supabase is not configured.");
  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", { auth: { autoRefreshToken: false, persistSession: false } });
}
