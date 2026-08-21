export type PostStatus = "draft" | "scheduled" | "published";

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  /** Tiptap JSON document (JSONContent) — stored as jsonb in Supabase */
  content: Record<string, unknown> | null;
  /** Rendered HTML snapshot, kept in sync for quick reads / SEO previews */
  contentHtml?: string;
  status: PostStatus;
  authorId: string;
  categoryIds: string[];
  tagIds: string[];
  readingTimeMinutes?: number;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export interface PostDraftInput {
  title: string;
  slug: string;
  content: Record<string, unknown> | null;
  contentHtml?: string;
  excerpt?: string;
  coverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export type SaveState = "idle" | "saving" | "saved" | "error";
