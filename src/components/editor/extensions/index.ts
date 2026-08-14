import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

import { Callout } from "./Callout";
import { MedicalWarning } from "./MedicalWarning";
import { SlashCommand } from "./SlashCommand";

const lowlight = createLowlight(common);

/**
 * Full extension set for the admin post editor. Import `getExtensions()`
 * rather than reaching into individual files, so the bundle stays a
 * single source of truth as new block types are added.
 */
export function getExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false, // replaced by CodeBlockLowlight below
      horizontalRule: {
        HTMLAttributes: { class: "editor-hr" },
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    Image.configure({ HTMLAttributes: { loading: "lazy" } }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === "heading" ? "Heading" : "Write something, or press '/' for commands…",
    }),
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({ nocookie: true, modestBranding: true }),
    TaskList.configure({ HTMLAttributes: { class: "not-prose pl-1" } }),
    TaskItem.configure({ nested: true }),
    CharacterCount,
    CodeBlockLowlight.configure({ lowlight }),
    Callout,
    MedicalWarning,
    SlashCommand,
  ];
}

export default getExtensions;
