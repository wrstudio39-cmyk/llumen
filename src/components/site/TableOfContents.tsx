"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocHeading } from "@/lib/toc";

export default function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="sticky top-24 hidden max-h-[70vh] overflow-y-auto pl-2 lg:block">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <List size={13} /> On this page
      </p>
      <ul className="mt-3 flex flex-col gap-2 border-l border-ink-100 dark:border-ink-800">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.5rem" : "1rem" }}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l-2 py-0.5 pl-3 text-sm transition-colors",
                activeId === h.id
                  ? "border-accent-600 font-medium text-accent-700 dark:text-accent-300"
                  : "border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
