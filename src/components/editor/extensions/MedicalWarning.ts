import { mergeAttributes, Node } from "@tiptap/core";

export interface MedicalWarningOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    medicalWarning: {
      /** Wrap the current selection/block in a medical-disclaimer box. */
      setMedicalWarning: () => ReturnType;
      unsetMedicalWarning: () => ReturnType;
    };
  }
}

/**
 * A fixed-tone clinical disclaimer block, for content that needs a
 * clearly flagged "this is educational, not medical advice" note.
 */
export const MedicalWarning = Node.create<MedicalWarningOptions>({
  name: "medicalWarning",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  parseHTML() {
    return [{ tag: "div.editor-medical-warning" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "editor-medical-warning",
      }),
      [
        "div",
        { class: "editor-callout-icon", contenteditable: "false", "aria-hidden": "true" },
        "🩺",
      ],
      [
        "div",
        { class: "w-full" },
        ["div", { class: "editor-node-label mb-1 text-medical-600" }, "Medical disclaimer"],
        ["div", { class: "editor-callout-body" }, 0],
      ],
    ];
  },

  addCommands() {
    return {
      setMedicalWarning:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      unsetMedicalWarning:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

export default MedicalWarning;
