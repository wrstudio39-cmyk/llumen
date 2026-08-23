import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { calculateReadingTime, extractPlainText } from "@/lib/utils";
import { getPostSeoRefs, revalidatePostSeo } from "@/lib/seoRevalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const [{ data: cats }, { data: tags }] = await Promise.all([
    supabase.from("post_categories").select("category_id").eq("post_id", id),
    supabase.from("post_tags").select("tag_id").eq("post_id", id),
  ]);

  return NextResponse.json({
    post: {
      ...data,
      category_ids: (cats ?? []).map((c) => c.category_id),
      tag_ids: (tags ?? []).map((t) => t.tag_id),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const body = await request.json();

  // Needed to revalidate the *old* slug/status too, in case this patch
  // renames the post or unpublishes it (status -> draft) — otherwise the
  // previous public URL keeps serving stale ISR content for up to an hour.
  const { data: existing } = await supabase.from("posts").select("slug, status").eq("id", id).single();

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.content !== undefined) {
    patch.content = body.content;
    patch.reading_time_minutes = calculateReadingTime(extractPlainText(body.content));
  }
  if (body.contentHtml !== undefined) patch.content_html = body.contentHtml;
  if (body.excerpt !== undefined) patch.excerpt = body.excerpt;
  if (body.coverImageUrl !== undefined) patch.cover_image_url = body.coverImageUrl;
  if (body.status !== undefined) patch.status = body.status;
  // SEO fields — surfaced in the editor's "SEO & metadata" panel.
  if (body.metaTitle !== undefined) patch.meta_title = body.metaTitle;
  if (body.metaDescription !== undefined) patch.meta_description = body.metaDescription;
  if (body.canonicalUrl !== undefined) patch.canonical_url = body.canonicalUrl;

  // RLS (011_rls_policies.sql) enforces that only the post's own author,
  // or an admin/editor, can actually update it — this update simply fails
  // with a Postgres permission error for anyone else.
  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Category/tag assignment is relational, so it's handled as a
  // full replace rather than a column patch — only touched when the
  // editor actually sends an array (avoids clobbering on every
  // unrelated autosave).
  if (Array.isArray(body.categoryIds)) {
    await supabase.from("post_categories").delete().eq("post_id", id);
    if (body.categoryIds.length > 0) {
      await supabase
        .from("post_categories")
        .insert(body.categoryIds.map((categoryId: string) => ({ post_id: id, category_id: categoryId })));
    }
  }
  if (Array.isArray(body.tagIds)) {
    await supabase.from("post_tags").delete().eq("post_id", id);
    if (body.tagIds.length > 0) {
      await supabase.from("post_tags").insert(body.tagIds.map((tagId: string) => ({ post_id: id, tag_id: tagId })));
    }
  }

  const [{ data: cats }, { data: tags }] = await Promise.all([
    supabase.from("post_categories").select("category_id").eq("post_id", id),
    supabase.from("post_tags").select("tag_id").eq("post_id", id),
  ]);

  // Any patch could have published, unpublished, renamed (slug), or
  // recategorized the post — cheapest correct move is to just revalidate
  // both the old and new public surfaces rather than trying to diff what
  // actually changed. See src/lib/seoRevalidate.ts.
  if (existing?.status === "published" || data.status === "published") {
    const { categorySlugs, tagSlugs } = await getPostSeoRefs(supabase, id);
    revalidatePostSeo({
      slugs: [existing?.slug, data.slug],
      authorId: data.author_id,
      categorySlugs,
      tagSlugs,
    });
  }

  return NextResponse.json({
    post: {
      ...data,
      category_ids: (cats ?? []).map((c) => c.category_id),
      tag_ids: (tags ?? []).map((t) => t.tag_id),
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Fetch the public-facing details before the row is gone, so a
  // previously-published article can be de-listed (sitemap, listings,
  // category/tag pages) immediately instead of 404ing only after the
  // next ISR window.
  const { data: existing } = await supabase.from("posts").select("slug, status, author_id").eq("id", id).single();
  const { categorySlugs, tagSlugs } = existing?.status === "published"
    ? await getPostSeoRefs(supabase, id)
    : { categorySlugs: [], tagSlugs: [] };

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.status === "published") {
    revalidatePostSeo({ slugs: [existing.slug], authorId: existing.author_id, categorySlugs, tagSlugs });
  }

  return NextResponse.json({ ok: true });
}
