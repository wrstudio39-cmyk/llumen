import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

interface PostSeoRefs {
  /** Current slug, and — if it just changed — the previous one too. */
  slugs?: (string | null | undefined)[];
  authorId?: string | null;
  categorySlugs?: string[];
  tagSlugs?: string[];
}

/**
 * Call this any time a post's public visibility could have changed:
 * published, unpublished (back to draft), rescheduled, edited while
 * published, deleted, or auto-published by the cron job.
 *
 * Every public page in this app (`/`, `/blog`, `/blog/[slug]`,
 * `/blog/category/[slug]`, `/blog/tag/[slug]`, `/author/[id]`) and
 * `/sitemap.xml` are ISR-cached (`revalidate = 3600`) for performance —
 * that cache is what keeps the site fast and keeps `/sitemap.xml` from
 * hitting the database on every crawl. On-demand revalidation is what
 * makes a publish/unpublish/delete show up immediately instead of
 * waiting up to an hour, without giving up that caching.
 */
export function revalidatePostSeo(refs: PostSeoRefs) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");

  for (const slug of refs.slugs ?? []) {
    if (slug) revalidatePath(`/blog/${slug}`);
  }
  if (refs.authorId) revalidatePath(`/author/${refs.authorId}`);
  for (const slug of refs.categorySlugs ?? []) revalidatePath(`/blog/category/${slug}`);
  for (const slug of refs.tagSlugs ?? []) revalidatePath(`/blog/tag/${slug}`);
}

/** Looks up the category/tag slugs currently attached to a post, for revalidation. */
export async function getPostSeoRefs(
  supabase: SupabaseClient,
  postId: string
): Promise<{ categorySlugs: string[]; tagSlugs: string[] }> {
  const [{ data: cats }, { data: tags }] = await Promise.all([
    supabase.from("post_categories").select("categories(slug)").eq("post_id", postId),
    supabase.from("post_tags").select("tags(slug)").eq("post_id", postId),
  ]);
  return {
    categorySlugs: ((cats ?? []) as unknown as { categories: { slug: string } | null }[])
      .map((c) => c.categories?.slug)
      .filter((s): s is string => Boolean(s)),
    tagSlugs: ((tags ?? []) as unknown as { tags: { slug: string } | null }[])
      .map((t) => t.tags?.slug)
      .filter((s): s is string => Boolean(s)),
  };
}
