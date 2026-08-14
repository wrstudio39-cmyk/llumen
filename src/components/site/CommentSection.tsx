"use client";

import { useState } from "react";
import { MessageCircle, Send, Clock } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { PublicComment } from "@/lib/publicData";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function CommentSection({ postId, initialComments }: { postId: string; initialComments: PublicComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError(null);

    if (!isSupabaseConfigured) {
      setState("error");
      setError("Comments require a connected database — connect Supabase to enable this.");
      return;
    }

    const supabase = getSupabaseClient();
    const { error: insertError } = await supabase!.from("comments").insert({
      post_id: postId,
      author_name: name.trim() || "Anonymous",
      author_email: email.trim() || null,
      content: content.trim(),
      status: "pending",
    });

    if (insertError) {
      setState("error");
      setError(insertError.message);
      return;
    }

    setState("done");
    setContent("");
  };

  return (
    <section className="mt-16 border-t border-ink-100 pt-10 dark:border-ink-800">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-900 dark:text-white">
        <MessageCircle size={19} /> Discussion {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mt-6 flex flex-col gap-6">
        {comments.length === 0 && (
          <p className="text-sm text-ink-400">Be the first to share your thoughts.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
              {initials(c.authorName)}
            </div>
            <div className="min-w-0 flex-1 rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">{c.authorName}</span>
                <span className="text-xs text-ink-400">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 rounded-xl2 border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Leave a comment</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
          />
          <input
            type="email"
            placeholder="Email (not published)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
          />
        </div>
        <textarea
          required
          placeholder="Share your thoughts…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mt-3 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
        />

        {state === "done" && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-accent-600">
            <Clock size={14} /> Submitted — it'll appear once approved by our team.
          </p>
        )}
        {state === "error" && <p className="mt-3 text-sm text-medical-600">{error}</p>}

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent-700 disabled:opacity-60"
        >
          <Send size={13} /> {state === "loading" ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
