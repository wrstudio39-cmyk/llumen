import type { MetadataRoute } from "next";
import { createPublicSupabase, isSupabaseConfigured } from "@/lib/supabaseServer";

// Safety-net time-based revalidation. In normal operation this route is
// invalidated on demand the instant a post is published/unpublished/
// deleted (see src/lib/seoRevalidate.ts, called from the publish/patch/
// delete/schedule/cron routes) — this 1-hour window is just a fallback
// so the sitemap can never drift further than that even if an edge case
// slips through.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  if (!isSupabaseConfigured) return staticRoutes;

  // Deliberately the anon/cookie-free client, not createServerSupabase():
  // this table read is fully public (published posts only — same as the
  // rest of the public site), and avoiding next/headers cookies here is
  // what allows this route to be cached/ISR'd instead of re-querying the
  // database on every single crawler hit. See src/lib/supabaseServer.ts.
  const supabase = createPublicSupabase();

  const [{ data: posts }, { data: categories }, { data: tags }, { data: authors }] = await Promise.all([
    supabase.from("posts").select("slug, updated_at").eq("status", "published"),
    supabase.from("categories").select("slug"),
    supabase.from("tags").select("slug"),
    supabase.from("posts").select("author_id").eq("status", "published").not("author_id", "is", null),
  ]);

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${base}/blog/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = (tags ?? []).map((t) => ({
    url: `${base}/blog/tag/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const uniqueAuthorIds = Array.from(new Set((authors ?? []).map((a) => a.author_id).filter(Boolean)));
  const authorRoutes: MetadataRoute.Sitemap = uniqueAuthorIds.map((id) => ({
    url: `${base}/author/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes, ...authorRoutes];
}
