import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

/**
 * Aggregate counts for the admin dashboard. Every query here runs through
 * createServerSupabase(), so RLS still governs what's actually returned —
 * an 'author' role will simply see zeros for things they can't read
 * (comments, subscribers) rather than the route needing its own auth check.
 */
export async function GET() {
  const supabase = await createServerSupabase();

  const [posts, comments, subscribers, categories] = await Promise.all([
    supabase.from("posts").select("status", { count: "exact" }),
    supabase.from("comments").select("status", { count: "exact" }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  const postRows = posts.data ?? [];
  const commentRows = comments.data ?? [];

  const countBy = (rows: { status: string }[], status: string) =>
    rows.filter((r) => r.status === status).length;

  return NextResponse.json({
    posts: {
      total: postRows.length,
      published: countBy(postRows, "published"),
      draft: countBy(postRows, "draft"),
      scheduled: countBy(postRows, "scheduled"),
    },
    comments: {
      total: commentRows.length,
      pending: countBy(commentRows, "pending"),
      approved: countBy(commentRows, "approved"),
      spam: countBy(commentRows, "spam"),
    },
    subscribers: subscribers.count ?? 0,
    categories: categories.count ?? 0,
  });
}
