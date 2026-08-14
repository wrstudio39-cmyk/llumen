import type { Editor, Range } from "@tiptap/core";
import {
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
  Lightbulb,
  AlertTriangle,
  Stethoscope,
  Type,
  type LucideIcon,
} from "lucide-react";

export interface SlashItem {
  title: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  command: (params: { editor: Editor; range: Range }) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    keywords: ["paragraph", "text", "p"],
    icon: Type,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Big section heading",
    keywords: ["h1", "heading", "title"],
    icon: Heading1,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    keywords: ["h3", "heading"],
    icon: Heading3,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Bulleted list",
    description: "Simple unordered list",
    keywords: ["bullet", "list", "ul"],
    icon: List,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    description: "Ordered, numbered list",
    keywords: ["ordered", "number", "ol"],
    icon: ListOrdered,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task list",
    description: "Checkbox to-do list",
    keywords: ["todo", "task", "checkbox"],
    icon: ListChecks,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Blockquote / pull quote",
    keywords: ["quote", "blockquote", "citation"],
    icon: Quote,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code block",
    description: "Syntax-highlighted code",
    keywords: ["code", "snippet", "pre"],
    icon: Code2,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Table",
    description: "Insert a 3x3 table",
    keywords: ["table", "grid"],
    icon: Table2,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: "Image",
    description: "Embed an image by URL",
    keywords: ["image", "picture", "photo"],
    icon: ImageIcon,
    command: ({ editor, range }) => {
      const url = window.prompt("Image URL");
      if (!url) return;
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
    },
  },
  {
    title: "YouTube",
    description: "Embed a YouTube video",
    keywords: ["youtube", "video", "embed"],
    icon: Youtube,
    command: ({ editor, range }) => {
      const url = window.prompt("YouTube URL");
      if (!url) return;
      editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    keywords: ["divider", "hr", "separator"],
    icon: Minus,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Callout",
    description: "Highlighted note box",
    keywords: ["callout", "note", "info", "tip"],
    icon: Lightbulb,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().setCallout("info").run(),
  },
  {
    title: "Warning callout",
    description: "Highlighted warning box",
    keywords: ["warning", "caution", "alert"],
    icon: AlertTriangle,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().setCallout("warning").run(),
  },
  {
    title: "Medical disclaimer",
    description: "Flag content as educational, not medical advice",
    keywords: ["medical", "disclaimer", "health", "warning"],
    icon: Stethoscope,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().setMedicalWarning().run(),
  },
];

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
  );
}
