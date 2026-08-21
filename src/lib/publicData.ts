import { createPublicSupabase, isSupabaseConfigured } from "@/lib/supabaseServer";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PublicAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface PublicTag {
  id: string;
  name: string;
  slug: string;
}

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentHtml: string | null;
  readingTimeMinutes: number;
  publishedAt: string | null;
  updatedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  author: PublicAuthor | null;
  categories: PublicCategory[];
  tags: PublicTag[];
}

export interface PublicComment {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  footerDescription: string;
  contactEmail: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
}

export interface AuthorProfile {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Lumen",
  tagline: "Clear, honest health writing",
  heroHeading: "Health writing that respects your intelligence.",
  heroSubheading:
    "Clear, judgment-free explainers on reproductive health, contraception, and relationships — written with clinicians, for people who just want a straight answer.",
  footerDescription:
    "Clear, clinician-reviewed writing on reproductive health, contraception, and relationships — no jargon, no judgment.",
  contactEmail: "hello@lumen.health",
  twitterUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  metaTitle: "Lumen — Clear, honest health writing",
  metaDescription:
    "Clear, clinician-reviewed writing on reproductive health, contraception, and relationships — no jargon, no judgment.",
  ogImageUrl: null,
};

/* ------------------------------------------------------------------ */
/* Row shaping                                                         */
/* ------------------------------------------------------------------ */

function shapePost(row: Record<string, any>): PublicPost {
  const author = row.author
    ? { id: row.author.id, name: row.author.name, avatarUrl: row.author.avatar_url, bio: row.author.bio }
    : null;

  const categories: PublicCategory[] =
    (row.post_categories ?? [])
      .map((pc: any) => pc.categories)
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description })) ?? [];

  const tags: PublicTag[] =
    (row.post_tags ?? [])
      .map((pt: any) => pt.tags)
      .filter(Boolean)
      .map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) ?? [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    contentHtml: row.content_html,
    readingTimeMinutes: row.reading_time_minutes ?? 1,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    author,
    categories,
    tags,
  };
}

const POST_SELECT = `
  id, title, slug, excerpt, cover_image_url, content_html, reading_time_minutes,
  published_at, updated_at, meta_title, meta_description,
  author:profiles!posts_author_id_fkey ( id, name, avatar_url, bio ),
  post_categories ( categories ( id, name, slug, description ) ),
  post_tags ( tags ( id, name, slug ) )
`;

/* ------------------------------------------------------------------ */
/* Demo fallback content — used only when Supabase isn't configured   */
/* yet, so the reading experience is never a blank page.              */
/* ------------------------------------------------------------------ */

const DEMO_POSTS: PublicPost[] = [
  {
    id: "demo-1",
    title: "Understanding Your Cycle: A Beginner's Guide",
    slug: "understanding-your-cycle",
    excerpt:
      "Everything you wish someone had explained clearly the first time — phases, hormones, and what's actually normal.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1600&auto=format&fit=crop",
    contentHtml:
      "<p>This is demo content shown because your Supabase project isn't connected yet. Once you add real environment variables and publish a post from the admin dashboard, it will appear here instead.</p><h2>Why cycles vary</h2><p>Every body runs on its own rhythm, shaped by hormones, stress, and health.</p>",
    readingTimeMinutes: 6,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metaTitle: null,
    metaDescription: null,
    author: { id: "demo", name: "Dr. Amara Osei", avatarUrl: null, bio: "Board-certified OB-GYN." },
    categories: [{ id: "c1", name: "Reproductive Health", slug: "reproductive-health" }],
    tags: [{ id: "t1", name: "Beginner Guide", slug: "beginner-guide" }],
  },
];

/* ------------------------------------------------------------------ */
/* Public queries                                                      */
/* ------------------------------------------------------------------ */

export async function getPublishedPosts(limit = 50): Promise<PublicPost[]> {
  if (!isSupabaseConfigured) return DEMO_POSTS;
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(shapePost);
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  if (!isSupabaseConfigured) return DEMO_POSTS.find((p) => p.slug === slug) ?? null;
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return shapePost(data);
}

export async function getRelatedPosts(post: PublicPost, limit = 3): Promise<PublicPost[]> {
  if (!isSupabaseConfigured) return DEMO_POSTS.filter((p) => p.slug !== post.slug).slice(0, limit);
  const categorySlugs = post.categories.map((c) => c.slug);
  if (categorySlugs.length === 0) {
    const all = await getPublishedPosts(limit + 1);
    return all.filter((p) => p.slug !== post.slug).slice(0, limit);
  }
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit * 3);
  if (error || !data) return [];
  const shaped = data.map(shapePost);
  const related = shaped.filter((p) => p.categories.some((c) => categorySlugs.includes(c.slug)));
  return (related.length > 0 ? related : shaped).slice(0, limit);
}

export async function getCategories(): Promise<PublicCategory[]> {
  if (!isSupabaseConfigured)
    return [{ id: "c1", name: "Reproductive Health", slug: "reproductive-health", description: null }];
  const supabase = createPublicSupabase();
  const { data, error } = await supabase.from("categories").select("id, name, slug, description").order("name");
  if (error || !data) return [];
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getPostsByCategory(slug: string): Promise<PublicPost[]> {
  const all = await getPublishedPosts(200);
  return all.filter((p) => p.categories.some((c) => c.slug === slug));
}

export async function getTags(): Promise<PublicTag[]> {
  if (!isSupabaseConfigured) return [{ id: "t1", name: "Beginner Guide", slug: "beginner-guide" }];
  const supabase = createPublicSupabase();
  const { data, error } = await supabase.from("tags").select("id, name, slug").order("name");
  if (error || !data) return [];
  return data;
}

export async function getTagBySlug(slug: string): Promise<PublicTag | null> {
  const tags = await getTags();
  return tags.find((t) => t.slug === slug) ?? null;
}

export async function getPostsByTag(slug: string): Promise<PublicPost[]> {
  const all = await getPublishedPosts(200);
  return all.filter((p) => p.tags.some((t) => t.slug === slug));
}

export async function getApprovedComments(postId: string): Promise<PublicComment[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, author_name, content, created_at")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.id,
    postId: c.post_id,
    parentId: c.parent_id,
    authorName: c.author_name || "Anonymous",
    content: c.content,
    createdAt: c.created_at,
  }));
}

export function estimateWordCount(html: string | null): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "site_name, tagline, hero_heading, hero_subheading, footer_description, contact_email, twitter_url, instagram_url, facebook_url, meta_title, meta_description, og_image_url"
    )
    .eq("id", true)
    .single();
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    siteName: data.site_name,
    tagline: data.tagline,
    heroHeading: data.hero_heading,
    heroSubheading: data.hero_subheading,
    footerDescription: data.footer_description,
    contactEmail: data.contact_email,
    twitterUrl: data.twitter_url,
    instagramUrl: data.instagram_url,
    facebookUrl: data.facebook_url,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    ogImageUrl: data.og_image_url,
  };
}

export async function getAuthorById(id: string): Promise<AuthorProfile | null> {
  if (!isSupabaseConfigured) {
    return id === "demo"
      ? { id: "demo", name: "Dr. Amara Osei", title: "Board-certified OB-GYN", bio: "Board-certified OB-GYN with a decade of clinical practice, writing to close the gap between the exam room and everyday life.", avatarUrl: null, twitterUrl: null, websiteUrl: null }
      : null;
  }
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, title, bio, avatar_url, twitter_url, website_url")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    title: data.title,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    twitterUrl: data.twitter_url,
    websiteUrl: data.website_url,
  };
}

export async function getPostsByAuthor(id: string): Promise<PublicPost[]> {
  if (!isSupabaseConfigured) return DEMO_POSTS;
  const all = await getPublishedPosts(200);
  return all.filter((p) => p.author?.id === id);
}
