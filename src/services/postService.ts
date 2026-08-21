import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { calculateReadingTime, extractPlainText, generateSlug } from "@/lib/utils";
import type { Post, PostDraftInput, PostStatus } from "@/types/post";

const LOCAL_KEY = "editor:mock-posts";

/* ------------------------------------------------------------------ */
/* Local (mock) persistence — used automatically until Supabase env   */
/* vars are set, so the editor is fully usable standalone.            */
/* ------------------------------------------------------------------ */

function readLocalPosts(): Record<string, Post> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Post>) : {};
  } catch {
    return {};
  }
}

function writeLocalPosts(posts: Record<string, Post>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(posts));
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* API layer — used once Supabase is configured. Talks only to our    */
/* own /api/posts routes, which enforce auth + RLS server-side; the   */
/* browser never holds a database credential.                        */
/* ------------------------------------------------------------------ */

function rowToPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    slug: (row.slug as string) ?? "",
    excerpt: (row.excerpt as string) ?? undefined,
    coverImageUrl: (row.cover_image_url as string) ?? undefined,
    content: (row.content as Record<string, unknown>) ?? null,
    contentHtml: (row.content_html as string) ?? undefined,
    status: (row.status as PostStatus) ?? "draft",
    authorId: (row.author_id as string) ?? "",
    categoryIds: (row.category_ids as string[]) ?? [],
    tagIds: (row.tag_ids as string[]) ?? [],
    readingTimeMinutes: (row.reading_time_minutes as number) ?? undefined,
    scheduledFor: (row.scheduled_for as string) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
    publishedAt: (row.published_at as string) ?? null,
    metaTitle: (row.meta_title as string) ?? undefined,
    metaDescription: (row.meta_description as string) ?? undefined,
    canonicalUrl: (row.canonical_url as string) ?? undefined,
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request to ${path} failed`);
  return json as T;
}

/* ------------------------------------------------------------------ */
/* Public API — every function below picks API-layer vs local mock    */
/* automatically based on whether Supabase env vars are set.          */
/* ------------------------------------------------------------------ */

export async function createDraft(input: PostDraftInput, authorId = "current-user"): Promise<Post> {
  if (isSupabaseConfigured) {
    const { post } = await api<{ post: Record<string, unknown> }>("/api/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return rowToPost(post);
  }

  const now = new Date().toISOString();
  const plainText = extractPlainText(input.content);
  const base: Post = {
    id: makeId(),
    title: input.title || "Untitled",
    slug: input.slug || generateSlug(input.title || "untitled"),
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    content: input.content,
    contentHtml: input.contentHtml,
    status: "draft",
    authorId,
    categoryIds: input.categoryIds ?? [],
    tagIds: input.tagIds ?? [],
    readingTimeMinutes: calculateReadingTime(plainText),
    scheduledFor: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    canonicalUrl: input.canonicalUrl,
  };
  const posts = readLocalPosts();
  posts[base.id] = base;
  writeLocalPosts(posts);
  return base;
}

export async function autosavePost(id: string, patch: PostDraftInput): Promise<Post> {
  if (isSupabaseConfigured) {
    const { post } = await api<{ post: Record<string, unknown> }>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return rowToPost(post);
  }

  const plainText = extractPlainText(patch.content);
  const posts = readLocalPosts();
  const existing = posts[id];
  if (!existing) throw new Error(`Post ${id} not found`);
  const updated: Post = {
    ...existing,
    ...patch,
    readingTimeMinutes: calculateReadingTime(plainText),
    updatedAt: new Date().toISOString(),
  };
  posts[id] = updated;
  writeLocalPosts(posts);
  return updated;
}

export async function publishPost(id: string): Promise<Post> {
  if (isSupabaseConfigured) {
    const { post } = await api<{ post: Record<string, unknown> }>(`/api/posts/${id}/publish`, {
      method: "POST",
    });
    return rowToPost(post);
  }
  return setLocalStatus(id, "published", {
    publishedAt: new Date().toISOString(),
    scheduledFor: null,
  });
}

export async function schedulePost(id: string, scheduledFor: string): Promise<Post> {
  if (isSupabaseConfigured) {
    const { post } = await api<{ post: Record<string, unknown> }>(`/api/posts/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledFor }),
    });
    return rowToPost(post);
  }
  return setLocalStatus(id, "scheduled", { scheduledFor });
}

export async function unpublishPost(id: string): Promise<Post> {
  if (isSupabaseConfigured) {
    const { post } = await api<{ post: Record<string, unknown> }>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "draft" }),
    });
    return rowToPost(post);
  }
  return setLocalStatus(id, "draft", { publishedAt: null, scheduledFor: null });
}

function setLocalStatus(
  id: string,
  status: PostStatus,
  extra: Partial<Pick<Post, "publishedAt" | "scheduledFor">>
): Post {
  const posts = readLocalPosts();
  const existing = posts[id];
  if (!existing) throw new Error(`Post ${id} not found`);
  const updated: Post = { ...existing, ...extra, status, updatedAt: new Date().toISOString() };
  posts[id] = updated;
  writeLocalPosts(posts);
  return updated;
}

export async function getPost(id: string): Promise<Post | null> {
  if (isSupabaseConfigured) {
    try {
      const { post } = await api<{ post: Record<string, unknown> }>(`/api/posts/${id}`);
      return rowToPost(post);
    } catch {
      return null;
    }
  }
  const posts = readLocalPosts();
  return posts[id] ?? null;
}

export async function listPosts(): Promise<Post[]> {
  if (isSupabaseConfigured) {
    const { posts } = await api<{ posts: Record<string, unknown>[] }>("/api/posts");
    return posts.map(rowToPost);
  }
  const posts = readLocalPosts();
  return Object.values(posts).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export { isSupabaseConfigured };
