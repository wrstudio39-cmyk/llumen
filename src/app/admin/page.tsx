"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, FileText, Clock, CalendarClock, MessageCircle, Mail, Tag } from "lucide-react";
import { listPosts } from "@/services/postService";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Post } from "@/types/post";

interface Stats {
  posts: { total: number; published: number; draft: number; scheduled: number };
  comments: { total: number; pending: number; approved: number; spam: number };
  subscribers: number;
  categories: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  tone?: "default" | "warn" | "accent";
}) {
  const content = (
    <div className="flex items-center justify-between rounded-xl2 border border-ink-100 bg-white p-5 transition-shadow hover:shadow-soft dark:border-ink-800 dark:bg-ink-900">
      <div>
        <p className="text-xs font-medium text-ink-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
      </div>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          tone === "warn" && "bg-warn-100 text-warn-600",
          tone === "accent" && "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
          tone === "default" && "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"
        )}
      >
        <Icon size={17} />
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    listPosts().then(setPosts);
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const recent = posts?.slice(0, 6) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">A snapshot of everything happening on Lumen.</p>
        </div>
        <Link
          href="/admin/new-post"
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-accent-700"
        >
          <PlusCircle size={15} />
          New post
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published" value={stats?.posts.published ?? "—"} icon={FileText} tone="accent" href="/admin/articles?status=published" />
        <StatCard label="Drafts" value={stats?.posts.draft ?? "—"} icon={Clock} href="/admin/articles?status=draft" />
        <StatCard label="Scheduled" value={stats?.posts.scheduled ?? "—"} icon={CalendarClock} href="/admin/articles?status=scheduled" />
        <StatCard
          label="Pending comments"
          value={stats?.comments.pending ?? "—"}
          icon={MessageCircle}
          tone={stats && stats.comments.pending > 0 ? "warn" : "default"}
          href="/admin/comments"
        />
        <StatCard label="Newsletter subscribers" value={stats?.subscribers ?? "—"} icon={Mail} />
        <StatCard label="Categories" value={stats?.categories ?? "—"} icon={Tag} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Recent articles</h2>
        <Link href="/admin/articles" className="text-sm font-medium text-accent-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl2 border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
        {posts === null && <div className="p-6 text-sm text-ink-400">Loading…</div>}

        {posts !== null && posts.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-14 text-center text-ink-400">
            <FileText size={22} />
            <p className="text-sm">No articles yet — start your first draft.</p>
          </div>
        )}

        {recent.map((post) => (
          <Link
            key={post.id}
            href={`/admin/edit-post/${post.id}`}
            className="flex items-center justify-between gap-4 border-b border-ink-50 px-5 py-4 transition-colors last:border-none hover:bg-ink-50 dark:border-ink-800/60 dark:hover:bg-ink-800/60"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800 dark:text-ink-100">
                {post.title || "Untitled"}
              </p>
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
