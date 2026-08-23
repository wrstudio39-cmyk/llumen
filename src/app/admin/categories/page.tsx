"use client";

import { useEffect, useState } from "react";
import { Tags, FolderKanban, Plus, Pencil, Trash2, X, Check, ShieldAlert } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { generateSlug, cn } from "@/lib/utils";

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount: number;
}

type Kind = "categories" | "tags";

function TaxonomyList({
  kind,
  title,
  icon: Icon,
  hint,
  hasDescription,
  canWrite,
}: {
  kind: Kind;
  title: string;
  icon: typeof Tags;
  hint: string;
  hasDescription: boolean;
  canWrite: boolean;
}) {
  const [items, setItems] = useState<Taxonomy[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const junctionTable = kind === "categories" ? "post_categories" : "post_tags";
  const junctionKey = kind === "categories" ? "category_id" : "tag_id";

  const load = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from(kind).select("*").order("name");
    if (loadError) {
      setError(loadError.message);
      return;
    }
    const rows = data ?? [];
    // Post counts, best-effort — junction table read is public so this should always work.
    const counts: Record<string, number> = {};
    await Promise.all(
      rows.map(async (row: { id: string }) => {
        const { count } = await supabase
          .from(junctionTable)
          .select("*", { count: "exact", head: true })
          .eq(junctionKey, row.id);
        counts[row.id] = count ?? 0;
      })
    );
    setItems(
      rows.map((row: { id: string; name: string; slug: string; description?: string | null }) => ({
        ...row,
        postCount: counts[row.id] ?? 0,
      }))
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setSlugTouched(false);
    setFormError(null);
    setShowForm(false);
  };

  const startEdit = (item: Taxonomy) => {
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setSlugTouched(true);
    setFormError(null);
    setShowForm(true);
  };

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(generateSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setFormError("Name and slug are both required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const supabase = getSupabaseClient();
    const payload: Record<string, string> = { name: name.trim(), slug: slug.trim() };
    if (hasDescription) payload.description = description.trim();

    const { error: writeError } = editingId
      ? await supabase!.from(kind).update(payload).eq("id", editingId)
      : await supabase!.from(kind).insert(payload);

    setBusy(false);
    if (writeError) {
      setFormError(writeError.message.includes("duplicate") ? "That slug is already in use." : writeError.message);
      return;
    }
    resetForm();
    load();
  };

  const handleDelete = async (item: Taxonomy) => {
    if (
      !confirm(
        item.postCount > 0
          ? `"${item.name}" is used on ${item.postCount} post${item.postCount === 1 ? "" : "s"}. Delete it anyway? It'll be removed from those posts.`
          : `Delete "${item.name}"?`
      )
    )
      return;
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase!.from(kind).delete().eq("id", item.id);
    if (deleteError) {
      alert(deleteError.message);
      return;
    }
    load();
  };

  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon size={18} className="text-accent-600" />
          <div>
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
            <p className="text-xs text-ink-400">{hint}</p>
          </div>
        </div>
        {canWrite && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-800/40"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-400">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Birth control"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(generateSlug(e.target.value));
                }}
                placeholder="birth-control"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
          </div>
          {hasDescription && (
            <div>
              <label className="text-xs font-medium text-ink-400">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
          )}
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            >
              <Check size={14} /> {busy ? "Saving…" : editingId ? "Save changes" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex flex-col divide-y divide-ink-100 dark:divide-ink-800">
        {items === null && <p className="py-3 text-sm text-ink-400">Loading…</p>}
        {items?.length === 0 && <p className="py-3 text-sm text-ink-400">No {title.toLowerCase()} yet.</p>}
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{item.name}</p>
              <p className="truncate text-xs text-ink-400">
                /{kind === "categories" ? "blog/category" : "blog/tag"}/{item.slug} · {item.postCount} post
                {item.postCount === 1 ? "" : "s"}
              </p>
            </div>
            {canWrite && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(item)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecked(true);
      return;
    }
    const supabase = getSupabaseClient();
    supabase!.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setChecked(true);
        return;
      }
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
      setRole(profile?.role ?? null);
      setChecked(true);
    });
  }, []);

  const canWrite = !isSupabaseConfigured || role === "admin" || role === "editor";

  if (checked && isSupabaseConfigured && role !== null && !canWrite) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink-200 p-14 text-center text-ink-400 dark:border-ink-800">
          <ShieldAlert size={22} />
          <p className="text-sm">Only admins and editors can manage categories and tags.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-3xl px-6 py-10")}>
      <div className="flex items-center gap-2.5">
        <FolderKanban size={20} className="text-accent-600" />
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Categories & tags</h1>
          <p className="mt-0.5 text-sm text-ink-400">
            Create, rename, or remove categories and tags — changes apply across the site immediately, no code
            changes needed.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <TaxonomyList
          kind="categories"
          title="Categories"
          icon={FolderKanban}
          hint="Used for top-level topic pages, e.g. /blog/category/birth-control"
          hasDescription
          canWrite={canWrite}
        />
        <TaxonomyList
          kind="tags"
          title="Tags"
          icon={Tags}
          hint="Looser labels for related-post grouping, e.g. /blog/tag/hormones"
          hasDescription={false}
          canWrite={canWrite}
        />
      </div>
    </div>
  );
}
