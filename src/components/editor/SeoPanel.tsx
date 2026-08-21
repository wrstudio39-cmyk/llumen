"use client";

import { useEffect, useState } from "react";
import { X, Search, Tag as TagIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

interface SeoPanelProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  categoryIds: string[];
  tagIds: string[];
  onChange: (patch: {
    excerpt?: string;
    metaTitle?: string;
    metaDescription?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }) => void;
}

function CounterBar({ length, min, max }: { length: number; min: number; max: number }) {
  const tone = length === 0 ? "bg-ink-200" : length < min || length > max ? "bg-warn-400" : "bg-emerald-400";
  const pct = Math.min(100, (length / max) * 100);
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div className={cn("h-full transition-all", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SeoPanel({
  open,
  onClose,
  postId,
  title,
  excerpt,
  metaTitle,
  metaDescription,
  categoryIds,
  tagIds,
  onChange,
}: SeoPanelProps) {
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.from("categories").select("id, name, slug").order("name").then(({ data }) => setCategories(data ?? []));
    supabase.from("tags").select("id, name, slug").order("name").then(({ data }) => setTags(data ?? []));
  }, []);

  const effectiveTitle = metaTitle || title || "Untitled article";
  const effectiveDescription = metaDescription || excerpt || "Add a meta description so this looks right in Google.";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "yoursite.com";

  const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-ink-100 bg-white shadow-floating transition-transform dark:border-ink-800 dark:bg-ink-900",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <p className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
            <Search size={16} /> SEO & metadata
          </p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          {/* Google preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Search preview</p>
            <div className="mt-2 rounded-xl2 border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950">
              <p className="truncate text-xs text-ink-500">{siteUrl} › blog › your-slug</p>
              <p className="mt-1 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{effectiveTitle}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{effectiveDescription}</p>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-xs font-medium text-ink-400">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => onChange({ excerpt: e.target.value })}
              rows={2}
              placeholder="Shown on cards and listings — one or two sentences."
              className="mt-1 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
          </div>

          {/* Meta title */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-400">Meta title</label>
              <span className={cn("text-xs", metaTitle.length > 60 ? "text-warn-600" : "text-ink-300")}>
                {metaTitle.length}/60
              </span>
            </div>
            <input
              value={metaTitle}
              onChange={(e) => onChange({ metaTitle: e.target.value })}
              placeholder={title || "Defaults to the article title"}
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
            <CounterBar length={metaTitle.length} min={30} max={60} />
          </div>

          {/* Meta description */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-400">Meta description</label>
              <span className={cn("text-xs", metaDescription.length > 160 ? "text-warn-600" : "text-ink-300")}>
                {metaDescription.length}/160
              </span>
            </div>
            <textarea
              value={metaDescription}
              onChange={(e) => onChange({ metaDescription: e.target.value })}
              rows={3}
              placeholder="The single most important field for click-through from Google. Aim for 120–160 characters."
              className="mt-1 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
            <CounterBar length={metaDescription.length} min={120} max={160} />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="text-xs font-medium text-ink-400">Categories</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChange({ categoryIds: toggleId(categoryIds, c.id) })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      categoryIds.includes(c.id)
                        ? "border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                        : "border-ink-200 text-ink-500 hover:border-accent-200 dark:border-ink-700"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-ink-400">
                <TagIcon size={11} /> Tags
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange({ tagIds: toggleId(tagIds, t.id) })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      tagIds.includes(t.id)
                        ? "border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                        : "border-ink-200 text-ink-500 hover:border-accent-200 dark:border-ink-700"
                    )}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!postId && (
            <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-400 dark:bg-ink-800/50">
              Start typing your article first — categories and tags save once the draft is created.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
