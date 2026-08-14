"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { SlashItem } from "./extensions/slashItems";
import { cn } from "@/lib/utils";

export interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Notion-style "/" command palette. Mounted via a Tiptap `Suggestion`
 * renderer (see extensions/SlashCommand.ts), which forwards keydown
 * events into this component through the imperative handle.
 */
const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const select = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelected((prev) => (prev + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((prev) => (prev - 1 + items.length) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-xl2 border border-ink-100 bg-white p-3 text-sm text-ink-400 shadow-floating dark:border-ink-800 dark:bg-ink-900">
        No matching blocks
      </div>
    );
  }

  return (
    <div className="max-h-80 w-72 overflow-y-auto rounded-xl2 border border-ink-100 bg-white p-1.5 shadow-floating animate-pop-in dark:border-ink-800 dark:bg-ink-900">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onMouseEnter={() => setSelected(index)}
            onClick={() => select(index)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
              index === selected
                ? "bg-accent-50 dark:bg-accent-900/30"
                : "hover:bg-ink-50 dark:hover:bg-ink-800"
            )}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-white text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink-800 dark:text-ink-100">
                {item.title}
              </span>
              <span className="block truncate text-xs text-ink-400">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

SlashMenu.displayName = "SlashMenu";

export default SlashMenu;
