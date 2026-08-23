import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { getPostSeoRefs, revalidatePostSeo } from "@/lib/seoRevalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "published", published_at: new Date().toISOString(), scheduled_for: null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Make the new article discoverable (sitemap, listings, category/tag
  // pages, author page) immediately instead of waiting for the hourly ISR
  // window — see src/lib/seoRevalidate.ts.
  const { categorySlugs, tagSlugs } = await getPostSeoRefs(supabase, id);
  revalidatePostSeo({ slugs: [data.slug], authorId: data.author_id, categorySlugs, tagSlugs });

  return NextResponse.json({ post: data });
}
