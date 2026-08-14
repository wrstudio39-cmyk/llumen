"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PlusCircle, FileText, Search } from "lucide-react";
import { listPosts } from "@/services/postService";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Post, PostStatus } from "@/types/post";

const TABS: { label: string; value: PostStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
];

function ArticlesPageInner() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("status") as PostStatus | "all") || "all";

  useEffect(() => {
    listPosts().then(setPosts);
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    return posts
      .filter((p) => activeTab === "all" || p.status === activeTab)
      .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));
  }, [posts, activeTab, query]);

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    router.push(`/admin/articles?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Articles</h1>
          <p className="mt-1 text-sm text-ink-400">Everything you&apos;ve drafted, scheduled, or published.</p>
        </div>
        <Link
          href="/admin/new-post"
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-accent-700"
        >
          <PlusCircle size={15} /> New post
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === t.value
                  ? "bg-white text-ink-900 shadow-soft dark:bg-ink-900 dark:text-white"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-56 rounded-lg border border-ink-200 py-2 pl-8 pr-3 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
        {posts === null && <div className="p-6 text-sm text-ink-400">Loading…</div>}

        {posts !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-14 text-center text-ink-400">
            <FileText size={22} />
            <p className="text-sm">No articles match this view.</p>
          </div>
        )}

        {filtered.map((post) => (
          <Link
            key={post.id}
            href={`/admin/edit-post/${post.id}`}
            className="flex items-center justify-between gap-4 border-b border-ink-50 px-5 py-4 transition-colors last:border-none hover:bg-ink-50 dark:border-ink-800/60 dark:hover:bg-ink-800/60"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800 dark:text-ink-100">{post.title || "Untitled"}</p>
              <p className="mt-0.5 truncate text-xs text-ink-400">
                Updated {formatRelativeTime(post.updatedAt)} · {post.readingTimeMinutes ?? 1} min read
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                post.status === "draft" && "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300",
                post.status === "scheduled" && "bg-warn-100 text-warn-600",
                post.status === "published" && "bg-emerald-100 text-emerald-700"
              )}
            >
              {post.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageInner />
    </Suspense>
  );
}
