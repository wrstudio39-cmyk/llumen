import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Twitter, Globe, BookOpen } from "lucide-react";
import SiteChrome from "@/components/site/SiteChrome";
import PostCard from "@/components/site/PostCard";
import Reveal, { RevealGroup, RevealItem } from "@/components/site/Reveal";
import HeroBlob from "@/components/site/HeroBlob";
import { getAuthorById, getPostsByAuthor } from "@/lib/publicData";

interface Props {
  params: Promise<{ id: string }>;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) return { title: "Author" };
  return {
    title: author.name,
    description: author.bio || `Articles by ${author.name} on Lumen.`,
    alternates: { canonical: `/author/${id}` },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) notFound();

  const posts = await getPostsByAuthor(id);

  return (
    <SiteChrome>
      <section className="relative overflow-hidden border-b border-ink-100 dark:border-ink-800">
        <HeroBlob />
        <Reveal className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent-100 text-2xl font-bold text-accent-700 shadow-soft dark:bg-accent-900/40 dark:text-accent-300">
            {initials(author.name)}
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink-900 dark:text-white md:text-4xl">
            {author.name}
          </h1>
          {author.title && <p className="mt-1 text-sm font-medium text-accent-600">{author.title}</p>}
          {author.bio && (
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-500 dark:text-ink-400">
              {author.bio}
            </p>
          )}

          <div className="mt-5 flex items-center justify-center gap-3">
            {author.twitterUrl && (
              <a
                href={author.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700"
                aria-label="Twitter profile"
              >
                <Twitter size={15} />
              </a>
            )}
            {author.websiteUrl && (
              <a
                href={author.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700"
                aria-label="Personal website"
              >
                <Globe size={15} />
              </a>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-ink-400">
            <BookOpen size={13} /> {posts.length} published article{posts.length === 1 ? "" : "s"}
          </p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14">
        {posts.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-ink-200 bg-white p-14 text-center dark:border-ink-800 dark:bg-ink-900">
            <p className="text-ink-400">No published articles yet.</p>
          </div>
        ) : (
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <RevealItem key={post.id}>
                <PostCard post={post} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm font-medium text-accent-600 hover:underline">
            ← Back to all articles
          </Link>
        </div>
      </div>
    </SiteChrome>
  );
}
