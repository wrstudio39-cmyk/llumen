"use client";

import { useEffect, useState } from "react";
import { Check, X, ShieldAlert, Trash2, MessageCircle } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { formatRelativeTime, cn } from "@/lib/utils";

interface CommentRow {
  id: string;
  post_id: string;
  author_name: string | null;
  author_email: string | null;
  content: string;
  status: "pending" | "approved" | "spam" | "rejected";
  created_at: string;
  posts?: { title: string; slug: string } | null;
}

const FILTERS: { label: string; value: CommentRow["status"] | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Spam", value: "spam" },
  { label: "All", value: "all" },
];

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [filter, setFilter] = useState<CommentRow["status"] | "all">("pending");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isSupabaseConfigured) {
      setComments([]);
      return;
    }
    const supabase = getSupabaseClient();
    const { data, error: fetchError } = await supabase!
      .from("comments")
      .select("id, post_id, author_name, author_email, content, status, created_at, posts ( title, slug )")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setComments((data as unknown as CommentRow[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: CommentRow["status"]) => {
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase!.from("comments").update({ status }).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setComments((prev) => prev?.map((c) => (c.id === id ? { ...c, status } : c)) ?? null);
  };

  const remove = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase!.from("comments").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
  };

  const filtered = comments?.filter((c) => filter === "all" || c.status === filter) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Comments</h1>
      <p className="mt-1 text-sm text-ink-400">Moderate what shows up under your articles.</p>

      <div className="mt-6 flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-white text-ink-900 shadow-soft dark:bg-ink-900 dark:text-white"
                : "text-ink-500 hover:text-ink-800 dark:text-ink-400"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-medical-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {comments === null && <p className="text-sm text-ink-400">Loading…</p>}

        {comments !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink-200 p-14 text-center text-ink-400 dark:border-ink-800">
            <MessageCircle size={22} />
            <p className="text-sm">Nothing here.</p>
          </div>
        )}

        {filtered.map((c) => (
          <div key={c.id} className="rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                  {c.author_name || "Anonymous"}
                </span>
                {c.author_email && <span className="ml-2 text-xs text-ink-400">{c.author_email}</span>}
                {c.posts?.title && (
                  <span className="ml-2 text-xs text-accent-600">on &ldquo;{c.posts.title}&rdquo;</span>
                )}
              </div>
              <span className="text-xs text-ink-400">{formatRelativeTime(c.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{c.content}</p>
            <div className="mt-3 flex items-center gap-2">
              {c.status !== "approved" && (
                <button
                  onClick={() => updateStatus(c.id, "approved")}
                  className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20"
                >
                  <Check size={12} /> Approve
                </button>
              )}
              {c.status !== "spam" && (
                <button
                  onClick={() => updateStatus(c.id, "spam")}
                  className="flex items-center gap-1 rounded-lg bg-warn-50 px-2.5 py-1.5 text-xs font-semibold text-warn-600 hover:bg-warn-100"
                >
                  <ShieldAlert size={12} /> Spam
                </button>
              )}
              {c.status !== "rejected" && (
                <button
                  onClick={() => updateStatus(c.id, "rejected")}
                  className="flex items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-200 dark:bg-ink-800"
                >
                  <X size={12} /> Reject
                </button>
              )}
              <button
                onClick={() => remove(c.id)}
                className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-900/20"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
