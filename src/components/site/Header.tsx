"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import type { PublicCategory } from "@/lib/publicData";

export default function Header({ categories, siteName }: { categories: PublicCategory[]; siteName: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-shadow duration-300 ${
        scrolled
          ? "border-ink-100 bg-white/90 shadow-soft dark:border-ink-800 dark:bg-ink-950/90"
          : "border-transparent bg-white/70 dark:bg-ink-950/70"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-ink-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-white shadow-soft">
            <Sparkles size={16} />
          </span>
          {siteName}
        </Link>

        <nav className="hidden min-w-0 items-center gap-6 overflow-x-auto text-sm font-medium text-ink-500 dark:text-ink-300 md:flex">
          <Link href="/blog" className="whitespace-nowrap transition-colors hover:text-accent-600">
            All articles
          </Link>
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/blog/category/${c.slug}`}
              className="whitespace-nowrap transition-colors hover:text-accent-600"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden shrink-0 rounded-lg border border-ink-200 px-3.5 py-1.5 text-sm font-semibold text-ink-600 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700 dark:text-ink-300 sm:block"
          >
            Staff sign in
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <Link href="/blog" className="rounded-lg px-2 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900">
                All articles
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/blog/category/${c.slug}`}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900"
                >
                  {c.name}
                </Link>
              ))}
              <Link href="/login" className="mt-2 rounded-lg border border-ink-200 px-2 py-2 text-center text-sm font-semibold text-ink-700 dark:border-ink-700 dark:text-ink-200">
                Staff sign in
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
