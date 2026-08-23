import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { getPostSeoRefs, revalidatePostSeo } from "@/lib/seoRevalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const scheduledFor: string | undefined = body.scheduledFor;

  if (!scheduledFor) {
    return NextResponse.json({ error: "scheduledFor is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Read the slug before the update — if this post was already published
  // and is now being pushed to the future, it needs to stop being public
  // (and disappear from the sitemap) right away, not after an hour of
  // stale ISR cache serving the old, still-"published" version.
  const { data: existing } = await supabase.from("posts").select("slug").eq("id", id).single();

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "scheduled", scheduled_for: scheduledFor, published_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { categorySlugs, tagSlugs } = await getPostSeoRefs(supabase, id);
  revalidatePostSeo({
    slugs: [existing?.slug, data.slug],
    authorId: data.author_id,
    categorySlugs,
    tagSlugs,
  });

  return NextResponse.json({ post: data });
}
