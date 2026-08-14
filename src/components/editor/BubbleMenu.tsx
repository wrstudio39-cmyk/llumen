"use client";

import { useState } from "react";
import { BubbleMenu as TiptapBubbleMenu, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorBubbleMenuProps {
  editor: Editor;
}

function BubbleButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-ink-200 transition-colors hover:bg-ink-800",
        active && "bg-accent-600 text-white hover:bg-accent-600"
      )}
    >
      {children}
    </button>
  );
}

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const applyLink = () => {
    if (linkValue.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkValue.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkValue("");
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120, animation: "shift-away", maxWidth: 420 }}
      shouldShow={({ state }) => !state.selection.empty}
    >
      <div className="flex items-center gap-0.5 rounded-xl2 border border-ink-800 bg-ink-900 p-1 shadow-floating">
        {showLinkInput ? (
          <div className="flex items-center gap-1 px-1">
            <input
              autoFocus
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              placeholder="Paste a link…"
              className="h-8 w-48 rounded-md bg-ink-800 px-2 text-sm text-white placeholder:text-ink-500 focus:outline-none"
            />
            <button
              onClick={applyLink}
              className="rounded-md bg-accent-600 px-2 py-1 text-xs font-medium text-white hover:bg-accent-500"
            >
              Apply
            </button>
          </div>
        ) : (
          <>
            <BubbleButton
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={15} />
            </BubbleButton>
            <BubbleButton
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={15} />
            </BubbleButton>
            <BubbleButton
              label="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={15} />
            </BubbleButton>
            <BubbleButton
              label="Strikethrough"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={15} />
            </BubbleButton>
            <BubbleButton
              label="Highlight"
              active={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter size={15} />
            </BubbleButton>
            <BubbleButton
              label="Inline code"
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code size={15} />
            </BubbleButton>
            <div className="mx-0.5 h-5 w-px bg-ink-700" />
            <BubbleButton
              label="Link"
              active={editor.isActive("link")}
              onClick={() => {
                setLinkValue(editor.getAttributes("link").href ?? "");
                setShowLinkInput(true);
              }}
            >
              <LinkIcon size={15} />
            </BubbleButton>
          </>
        )}
      </div>
    </TiptapBubbleMenu>
  );
}
