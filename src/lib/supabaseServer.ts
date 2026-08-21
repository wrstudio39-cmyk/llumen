import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Public, cookie-free client — used for anonymous reads on the public
 * site (published posts, categories, site settings, etc). Unlike
 * createServerSupabase(), this never touches next/headers cookies, which
 * means the pages that use it are NOT forced into fully dynamic
 * (uncached, per-request) rendering. That's what lets the homepage,
 * article pages, and listings be statically generated / ISR'd instead
 * of hitting the database on every single page load — the single
 * biggest lever for public-site load speed in this app.
 *
 * Never use this where the result should depend on who's logged in —
 * it always queries as anon, so RLS only ever returns public rows.
 */
export function createPublicSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Session-aware server client — reads the caller's auth cookies, so every
 * query runs AS that user and is subject to the RLS policies in
 * database/011_rls_policies.sql. Use this for almost everything: it's
 * what makes "authors can only edit their own posts" actually enforced,
 * not just a UI convention.
 *
 * Must be called inside a request context (route handler, server action,
 * or middleware) since it reads `next/headers` cookies.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render — safe to ignore since
          // middleware refreshes the session on the next request anyway.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS entirely. Only ever import this in
 * API route handlers, never in client components, and only for the rare
 * operation that legitimately needs to act outside a user's own
 * permissions (e.g. a scheduled-publish cron job with no logged-in user).
 * Every route in this project that could use it instead uses
 * createServerSupabase() so RLS stays the single source of truth.
 */
export function createServiceSupabase() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for service-role operations."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
