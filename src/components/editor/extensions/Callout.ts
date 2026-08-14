import { mergeAttributes, Node } from "@tiptap/core";

export type CalloutTone = "info" | "warning";

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wrap the current selection/block in a callout box. */
      setCallout: (tone?: CalloutTone) => ReturnType;
      /** Remove the callout wrapper, keeping its content. */
      unsetCallout: () => ReturnType;
    };
  }
}

const ICONS: Record<CalloutTone, string> = {
  info: "💡",
  warning: "⚠️",
};

const LABELS: Record<CalloutTone, string> = {
  info: "Note",
  warning: "Warning",
};

/**
 * A callout / admonition block. Renders as:
 * <div class="editor-callout" data-tone="info">
 *   <div class="icon" contenteditable="false">💡</div>
 *   <div class="body">...editable block content...</div>
 * </div>
 */
export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      tone: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-tone") || "info",
        renderHTML: (attrs) => ({ "data-tone": attrs.tone }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.editor-callout" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tone = (node.attrs.tone as CalloutTone) || "info";
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: "editor-callout" }),
      [
        "div",
        { class: "editor-callout-icon", contenteditable: "false", "aria-hidden": "true" },
        ICONS[tone],
      ],
      ["div", { class: "editor-callout-body w-full" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (tone: CalloutTone = "info") =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { tone });
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

export default Callout;

export const CALLOUT_LABELS = LABELS;
