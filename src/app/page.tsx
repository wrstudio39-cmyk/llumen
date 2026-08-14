import SiteChrome from "@/components/site/SiteChrome";
import PostCard from "@/components/site/PostCard";
import NewsletterForm from "@/components/site/NewsletterForm";
import Reveal, { RevealGroup, RevealItem } from "@/components/site/Reveal";
import HeroBlob from "@/components/site/HeroBlob";
import { getPublishedPosts, getCategories, getSiteSettings } from "@/lib/publicData";
import Link from "next/link";
import { ArrowRight, ShieldCheck, BookOpen, Users } from "lucide-react";

export default async function HomePage() {
  const [posts, categories, settings] = await Promise.all([
    getPublishedPosts(13),
    getCategories(),
    getSiteSettings(),
  ]);
  const [featured, ...rest] = posts;

  return (
    <SiteChrome>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-100 dark:border-ink-800">
        <HeroBlob />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                <ShieldCheck size={13} /> Clinician-reviewed
              </span>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 dark:text-white md:text-6xl">
                {settings.heroHeading}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-ink-500 dark:text-ink-300">
                {settings.heroSubheading}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/blog"
                  className="group flex w-fit items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-accent-700 hover:shadow-floating"
                >
                  Start reading
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="flex items-center gap-4 text-sm text-ink-400">
                  <span className="flex items-center gap-1.5"><BookOpen size={14} /> {posts.length}+ articles</span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> Written with real clinicians</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Category chips */}
      {categories.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-6xl px-6 py-8" delay={0.05}>
          <RevealGroup className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <RevealItem key={c.id} y={10}>
                <Link
                  href={`/blog/category/${c.slug}`}
                  className="rounded-full border border-ink-200 px-4 py-1.5 text-sm font-medium text-ink-600 transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:text-accent-700 hover:shadow-soft dark:border-ink-700 dark:text-ink-300"
                >
                  {c.name}
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
      )}

      {/* Featured + grid */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {posts.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-ink-200 bg-white p-14 text-center dark:border-ink-800 dark:bg-ink-900">
            <p className="text-ink-400">No published articles yet — check back soon.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Reveal className="mb-10">
                <PostCard post={featured} featured />
              </Reveal>
            )}
            <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <RevealItem key={post.id}>
                  <PostCard post={post} />
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}
      </section>

      {/* Newsletter CTA */}
      <section id="newsletter" className="border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
            One thoughtful email a month.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-500 dark:text-ink-400">
            The most useful thing we published, with nothing else attached. Unsubscribe whenever.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </Reveal>
      </section>
    </SiteChrome>
  );
}
