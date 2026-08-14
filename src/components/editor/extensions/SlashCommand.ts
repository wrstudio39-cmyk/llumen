import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import SlashMenu, { type SlashMenuHandle } from "../SlashMenu";
import { filterSlashItems, type SlashItem } from "./slashItems";

export interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions<SlashItem>, "editor">;
}

/**
 * Registers a `/` trigger that opens a floating command palette
 * (rendered by SlashMenu.tsx) for inserting blocks — headings, lists,
 * tables, media, callouts, medical disclaimers, etc.
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        items: ({ query }: { query: string }) => filterSlashItems(query),
        command: ({ editor, range, props }) => {
          (props as SlashItem).command({ editor, range });
        },
        render: () => {
          let component: ReactRenderer<SlashMenuHandle>;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: (item: SlashItem) => props.command(item),
                },
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy("body", {
                getReferenceClientRect: () => props.clientRect!() as DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                offset: [0, 6],
                animation: false,
              });
            },

            onUpdate(props) {
              component.updateProps({
                items: props.items,
                command: (item: SlashItem) => props.command(item),
              });
              if (!props.clientRect) return;
              popup[0]?.setProps({
                getReferenceClientRect: () => props.clientRect!() as DOMRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup[0]?.hide();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommand;
