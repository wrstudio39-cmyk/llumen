import { NextResponse, type NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { getPostSeoRefs, revalidatePostSeo } from "@/lib/seoRevalidate";

/**
 * Called on a schedule (see vercel.json) to flip any post whose
 * `scheduled_for` time has passed into `published`. Uses the
 * service-role client since this runs with no logged-in user —
 * there's no session for RLS to check against.
 *
 * Protect it with CRON_SECRET so it can't be hit by randoms.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "published", published_at: nowIso, scheduled_for: null })
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .select("id, slug, author_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-publishing bypasses the admin "Publish" click, so it needs the
  // same on-demand revalidation that click would have triggered — see
  // src/lib/seoRevalidate.ts. Usually 0-1 posts per run (cron runs every
  // 5 minutes, see vercel.json), so per-post lookups here are cheap.
  for (const post of data ?? []) {
    const { categorySlugs, tagSlugs } = await getPostSeoRefs(supabase, post.id);
    revalidatePostSeo({ slugs: [post.slug], authorId: post.author_id, categorySlugs, tagSlugs });
  }

  return NextResponse.json({ published: data?.length ?? 0, posts: data });
}
