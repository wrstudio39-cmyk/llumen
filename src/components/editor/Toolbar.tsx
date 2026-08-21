"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Table2,
  ImageIcon,
  Youtube,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Cloud,
  CloudOff,
  Loader2,
  Check,
  Send,
  CalendarClock,
  Save,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveState } from "@/types/post";

interface ToolbarProps {
  editor: Editor;
  saveState: SaveState;
  wordCount: number;
  readingTimeMinutes: number;
  status: "draft" | "scheduled" | "published";
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  onOpenSeo: () => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-ink-300 dark:hover:bg-ink-800",
        active && "bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-accent-900/40 dark:text-accent-300"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-ink-100 dark:bg-ink-800" />;
}

function AutosaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { icon: React.ReactNode; label: string; className: string }> = {
    idle: { icon: <Cloud size={14} />, label: "All changes saved", className: "text-ink-400" },
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      label: "Saving…",
      className: "text-ink-400",
    },
    saved: { icon: <Check size={14} />, label: "Saved", className: "text-emerald-600" },
    error: { icon: <CloudOff size={14} />, label: "Couldn't save", className: "text-medical-600" },
  };
  const cfg = map[state];
  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function Toolbar({
  editor,
  saveState,
  wordCount,
  readingTimeMinutes,
  status,
  onSaveDraft,
  onPublish,
  onSchedule,
  onOpenSeo,
}: ToolbarProps) {
  const [imageOpen, setImageOpen] = useState(false);

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
    setImageOpen(false);
  };

  const insertYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-900/90">
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-thin">
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={insertLink}>
          <LinkIcon size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={insertImage}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Embed YouTube" onClick={insertYoutube}>
          <Youtube size={16} />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolbarButton>

        <div className="ml-auto flex shrink-0 items-center gap-4 pl-3">
          <span className="hidden text-xs text-ink-400 sm:inline">
            {wordCount.toLocaleString()} words · {readingTimeMinutes} min read
          </span>
          <AutosaveIndicator state={saveState} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-ink-50 px-3 py-2 dark:border-ink-800/60">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
            status === "draft" && "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300",
            status === "scheduled" && "bg-warn-100 text-warn-600",
            status === "published" && "bg-emerald-100 text-emerald-700"
          )}
        >
          {status}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSeo}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            <Search size={14} />
            SEO & metadata
          </button>
          <button
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            <Save size={14} />
            Save draft
          </button>
          <button
            onClick={onSchedule}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            <CalendarClock size={14} />
            Schedule
          </button>
          <button
            onClick={onPublish}
            className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent-700"
          >
            <Send size={14} />
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
