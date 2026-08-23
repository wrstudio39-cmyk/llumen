import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Calendar, ChevronRight } from "lucide-react";
import SiteChrome from "@/components/site/SiteChrome";
import PostCard from "@/components/site/PostCard";
import ReadingProgress from "@/components/site/ReadingProgress";
import TableOfContents from "@/components/site/TableOfContents";
import ShareButtons from "@/components/site/ShareButtons";
import CommentSection from "@/components/site/CommentSection";
import Reveal, { RevealGroup, RevealItem } from "@/components/site/Reveal";
import { getPostBySlug, getRelatedPosts, getApprovedComments, getPublishedPosts, getSiteSettings } from "@/lib/publicData";
import { buildTableOfContents } from "@/lib/toc";

export const revalidate = 3600; // 1 hour

// Pre-render every published post at build time for instant, cached
// page loads; new posts published later still work via ISR fallback.
export async function generateStaticParams() {
  const posts = await getPublishedPosts(500);
  return posts.map((post) => ({ slug: post.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [related, comments, settings] = await Promise.all([
    getRelatedPosts(post),
    getApprovedComments(post.id),
    getSiteSettings(),
  ]);
  const { html, headings } = buildTableOfContents(post.contentHtml);
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: post.title,
    description: post.excerpt || post.metaDescription || undefined,
    image: post.coverImageUrl || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt,
    url: articleUrl,
    mainEntityOfPage: articleUrl,
    author: post.author ? { "@type": "Person", name: post.author.name, url: `${siteUrl}/author/${post.author.id}` } : undefined,
    // Driven by Site settings (site_name / og_image_url) rather than a
    // hardcoded name, so renaming the site from the admin dashboard stays
    // consistent with every article's structured data.
    publisher: {
      "@type": "Organization",
      name: settings.siteName,
      ...(settings.ogImageUrl ? { logo: { "@type": "ImageObject", url: settings.ogImageUrl } } : {}),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <SiteChrome>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ReadingProgress />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-400">
          <Link href="/" className="hover:text-accent-600">Home</Link>
          <ChevronRight size={11} />
          <Link href="/blog" className="hover:text-accent-600">Articles</Link>
          <ChevronRight size={11} />
          <span className="truncate text-ink-500 dark:text-ink-300">{post.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="border-b border-ink-100 dark:border-ink-800">
        <Reveal className="mx-auto max-w-3xl px-6 pt-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {post.categories.map((c) => (
              <Link
                key={c.id}
                href={`/blog/category/${c.slug}`}
                className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink-900 dark:text-white md:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-ink-500 dark:text-ink-400">{post.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-5 dark:border-ink-800">
            <Link href={post.author ? `/author/${post.author.id}` : "#"} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                {post.author ? initials(post.author.name) : "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800 hover:text-accent-600 dark:text-ink-100">
                  {post.author?.name ?? `${settings.siteName} Editorial`}
                </p>
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTimeMinutes} min read</span>
                </div>
              </div>
            </Link>
            <ShareButtons title={post.title} url={articleUrl} />
          </div>
        </Reveal>

        {post.coverImageUrl && (
          <Reveal delay={0.1} className="mx-auto max-w-5xl px-6 pb-10">
            <div className="relative aspect-[16/8] overflow-hidden rounded-xl2 bg-ink-100 shadow-floating dark:bg-ink-800">
              <Image src={post.coverImageUrl} alt={post.title} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        )}
      </div>

      {/* Body + TOC */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
          <article className="min-w-0 order-2 lg:order-1">
            {html ? (
              <div className="editor-prose" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-ink-400">This article has no content yet.</p>
            )}

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-6 dark:border-ink-800">
                {post.tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/blog/tag/${t.slug}`}
                    className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-500 hover:border-accent-300 hover:text-accent-600 dark:border-ink-700 dark:text-ink-300"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}

            {post.author?.bio && (
              <Link
                href={`/author/${post.author.id}`}
                className="mt-10 flex gap-4 rounded-xl2 border border-ink-100 bg-white p-5 transition-shadow hover:shadow-soft dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                  {initials(post.author.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{post.author.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{post.author.bio}</p>
                  <span className="mt-1.5 inline-block text-xs font-semibold text-accent-600">View full profile →</span>
                </div>
              </Link>
            )}

            <CommentSection postId={post.id} initialComments={comments} />
          </article>

          <aside className="order-1 lg:order-2">
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
              Keep reading
            </h2>
            <RevealGroup className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <RevealItem key={p.id}>
                  <PostCard post={p} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </SiteChrome>
  );
}
