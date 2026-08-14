import Link from "next/link";
import { Sparkles, Twitter, Instagram, Facebook } from "lucide-react";
import NewsletterForm from "@/components/site/NewsletterForm";
import type { PublicCategory, SiteSettings } from "@/lib/publicData";

export default function Footer({ categories, settings }: { categories: PublicCategory[]; settings: SiteSettings }) {
  const socials = [
    { href: settings.twitterUrl, icon: Twitter, label: "Twitter" },
    { href: settings.instagramUrl, icon: Instagram, label: "Instagram" },
    { href: settings.facebookUrl, icon: Facebook, label: "Facebook" },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-ink-900 dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white">
                <Sparkles size={14} />
              </span>
              {settings.siteName}
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-400">{settings.footerDescription}</p>
            {socials.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-400 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Browse</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-500 dark:text-ink-300">
              <li><Link href="/blog" className="hover:text-accent-600">All articles</Link></li>
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link href={`/blog/category/${c.slug}`} className="hover:text-accent-600">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Site</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-500 dark:text-ink-300">
              <li>
                <Link href="/login" className="hover:text-accent-600">Staff sign in</Link>
                <span className="ml-1.5 text-xs text-ink-300">(team only)</span>
              </li>
              {settings.contactEmail && (
                <li><a href={`mailto:${settings.contactEmail}`} className="hover:text-accent-600">Contact</a></li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Get articles by email</p>
            <p className="mt-3 text-sm text-ink-400">One thoughtful email a month. No spam, ever.</p>
            <div className="mt-3">
              <NewsletterForm compact />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 dark:border-ink-800 md:flex-row">
          <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          <p>Educational content only — not a substitute for professional medical advice.</p>
        </div>
      </div>
    </footer>
  );
}
