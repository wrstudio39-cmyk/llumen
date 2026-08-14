import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether real Supabase credentials are configured.
 * The editor and admin pages fall back to an in-memory/localStorage mock
 * when this is false, so the frontend is fully usable before the backend
 * is wired up.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

/**
 * Lazily create a single shared browser Supabase client. Uses
 * `@supabase/ssr`'s cookie-based storage (not localStorage) so the
 * session is the same one `middleware.ts` and the API routes see —
 * required for auth to actually work across the client/server boundary.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
