"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { ImageIcon, X } from "lucide-react";

import { getExtensions } from "./extensions";
import Toolbar from "./Toolbar";
import EditorBubbleMenu from "./BubbleMenu";
import SeoPanel from "./SeoPanel";
import { cn, debounce, extractPlainText, generateSlug, calculateReadingTime } from "@/lib/utils";
import {
  autosavePost,
  createDraft,
  publishPost,
  schedulePost,
} from "@/services/postService";
import type { Post, SaveState } from "@/types/post";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

interface EditorProps {
  /** Pass an existing post to edit it; omit for a brand-new draft. */
  post?: Post | null;
  /** Called whenever the post is created/updated, so the parent page can sync route/id state. */
  onPostChange?: (post: Post) => void;
}

export default function Editor({ post, onPostChange }: EditorProps) {
  const [postId, setPostId] = useState<string | null>(post?.id ?? null);
  const [status, setStatus] = useState<Post["status"]>(post?.status ?? "draft");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(post?.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<string[]>(post?.tagIds ?? []);
  const [seoOpen, setSeoOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [wordCount, setWordCount] = useState(0);

  const titleRef = useRef(title);
  const slugRef = useRef(slug);
  const coverRef = useRef(coverImageUrl);
  const excerptRef = useRef(excerpt);
  const metaTitleRef = useRef(metaTitle);
  const metaDescriptionRef = useRef(metaDescription);
  titleRef.current = title;
  slugRef.current = slug;
  coverRef.current = coverImageUrl;
  excerptRef.current = excerpt;
  metaTitleRef.current = metaTitle;
  metaDescriptionRef.current = metaDescription;

  const editor = useEditor({
    extensions: getExtensions(),
    content: (post?.content as JSONContent) ?? EMPTY_DOC,
    editorProps: {
      attributes: {
        class: "editor-prose",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setWordCount(extractPlainText(json).trim().split(/\s+/).filter(Boolean).length);
      queueAutosave(json);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    setWordCount(extractPlainText(editor.getJSON()).trim().split(/\s+/).filter(Boolean).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const readingTimeMinutes = useMemo(
    () => calculateReadingTime(Array(wordCount).fill("w").join(" ") || " "),
    [wordCount]
  );

  const performAutosave = useCallback(async (content: JSONContent) => {
    setSaveState("saving");
    try {
      const html = editor?.getHTML();
      if (!postId) {
        const created = await createDraft({
          title: titleRef.current || "Untitled",
          slug: slugRef.current || generateSlug(titleRef.current || "untitled"),
          content,
          contentHtml: html,
          coverImageUrl: coverRef.current || undefined,
          excerpt: excerptRef.current || undefined,
          metaTitle: metaTitleRef.current || undefined,
          metaDescription: metaDescriptionRef.current || undefined,
        });
        setPostId(created.id);
        onPostChange?.(created);
      } else {
        const updated = await autosavePost(postId, {
          title: titleRef.current || "Untitled",
          slug: slugRef.current || generateSlug(titleRef.current || "untitled"),
          content,
          contentHtml: html,
          coverImageUrl: coverRef.current || undefined,
          excerpt: excerptRef.current || undefined,
          metaTitle: metaTitleRef.current || undefined,
          metaDescription: metaDescriptionRef.current || undefined,
        });
        onPostChange?.(updated);
      }
      setSaveState("saved");
    } catch (err) {
      console.error("Autosave failed", err);
      setSaveState("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, editor, onPostChange]);

  const queueAutosave = useMemo(() => debounce(performAutosave, 800), [performAutosave]);

  // Autosave when title/slug/cover/SEO fields change too (not just content).
  useEffect(() => {
    if (!editor) return;
    queueAutosave(editor.getJSON());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, coverImageUrl, excerpt, metaTitle, metaDescription]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(generateSlug(value));
  };

  const ensureSaved = async (): Promise<string> => {
    if (postId) return postId;
    if (!editor) throw new Error("Editor not ready");
    const created = await createDraft({
      title: titleRef.current || "Untitled",
      slug: slugRef.current || generateSlug(titleRef.current || "untitled"),
      content: editor.getJSON(),
      contentHtml: editor.getHTML(),
      coverImageUrl: coverRef.current || undefined,
    });
    setPostId(created.id);
    onPostChange?.(created);
    return created.id;
  };

  const handleSaveDraft = async () => {
    if (!editor) return;
    setSaveState("saving");
    try {
      const id = await ensureSaved();
      const updated = await autosavePost(id, {
        title: titleRef.current || "Untitled",
        slug: slugRef.current || generateSlug(titleRef.current || "untitled"),
        content: editor.getJSON(),
        contentHtml: editor.getHTML(),
        coverImageUrl: coverRef.current || undefined,
        excerpt: excerptRef.current || undefined,
        metaTitle: metaTitleRef.current || undefined,
        metaDescription: metaDescriptionRef.current || undefined,
      });
      onPostChange?.(updated);
      setSaveState("saved");
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  };

  const handlePublish = async () => {
    try {
      const id = await ensureSaved();
      const updated = await publishPost(id);
      setStatus(updated.status);
      onPostChange?.(updated);
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  };

  const handleSchedule = async () => {
    const when = window.prompt("Schedule for (e.g. 2026-08-15T09:00):");
    if (!when) return;
    try {
      const id = await ensureSaved();
      const updated = await schedulePost(id, new Date(when).toISOString());
      setStatus(updated.status);
      onPostChange?.(updated);
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  };

  const handleSeoChange = async (patch: {
    excerpt?: string;
    metaTitle?: string;
    metaDescription?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }) => {
    if (patch.excerpt !== undefined) setExcerpt(patch.excerpt);
    if (patch.metaTitle !== undefined) setMetaTitle(patch.metaTitle);
    if (patch.metaDescription !== undefined) setMetaDescription(patch.metaDescription);

    // Category/tag toggles write immediately (relational, not part of the
    // debounced content autosave) so the picker feels instant.
    if (patch.categoryIds !== undefined || patch.tagIds !== undefined) {
      const nextCategoryIds = patch.categoryIds ?? categoryIds;
      const nextTagIds = patch.tagIds ?? tagIds;
      setCategoryIds(nextCategoryIds);
      setTagIds(nextTagIds);
      try {
        const id = await ensureSaved();
        await autosavePost(id, {
          title: titleRef.current || "Untitled",
          slug: slugRef.current || generateSlug(titleRef.current || "untitled"),
          content: editor?.getJSON() ?? null,
          categoryIds: nextCategoryIds,
          tagIds: nextTagIds,
        });
      } catch (err) {
        console.error("Failed to save categories/tags", err);
      }
    }
  };

  if (!editor) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-ink-400">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <Toolbar
        editor={editor}
        saveState={saveState}
        wordCount={wordCount}
        readingTimeMinutes={readingTimeMinutes}
        status={status}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onOpenSeo={() => setSeoOpen(true)}
      />

      <SeoPanel
        open={seoOpen}
        onClose={() => setSeoOpen(false)}
        postId={postId}
        title={title}
        excerpt={excerpt}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        categoryIds={categoryIds}
        tagIds={tagIds}
        onChange={handleSeoChange}
      />

      <div className="flex-1 px-4 pb-32 pt-8 sm:px-0">
        <CoverImagePicker value={coverImageUrl} onChange={setCoverImageUrl} />

        <textarea
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Article title"
          rows={1}
          className="mt-6 w-full resize-none overflow-hidden border-none bg-transparent font-serif text-4xl font-bold leading-tight text-ink-900 placeholder:text-ink-200 focus:outline-none dark:text-ink-50 dark:placeholder:text-ink-700"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />

        <div className="mt-2 flex items-center gap-2 text-sm text-ink-400">
          <span>/{" "}</span>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(generateSlug(e.target.value));
            }}
            className="w-full max-w-sm border-none bg-transparent text-sm text-ink-400 focus:outline-none"
            placeholder="article-slug"
          />
        </div>

        <div className="mt-8">
          {editor && <EditorBubbleMenu editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function CoverImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-xl2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Cover" className="h-56 w-full object-cover sm:h-72" />
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Remove cover image"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            placeholder="Paste cover image URL…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onChange((e.target as HTMLInputElement).value);
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full max-w-md rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-900"
          />
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-dashed border-ink-200 px-3 py-2 text-sm text-ink-400 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700"
          )}
        >
          <ImageIcon size={15} />
          Add cover image
        </button>
      )}
    </div>
  );
}
