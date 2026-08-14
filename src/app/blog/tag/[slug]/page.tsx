import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/site/SiteChrome";
import PostCard from "@/components/site/PostCard";
import { RevealGroup, RevealItem } from "@/components/site/Reveal";
import { getTagBySlug, getPostsByTag } from "@/lib/publicData";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Tag" };
  return {
    title: `#${tag.name}`,
    description: `Articles tagged #${tag.name} on Lumen.`,
    alternates: { canonical: `/blog/tag/${slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(slug);

  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">Tag</span>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">
          #{tag.name}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{posts.length} articles</p>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-xl2 border border-dashed border-ink-200 bg-white p-14 text-center dark:border-ink-800 dark:bg-ink-900">
            <p className="text-ink-400">No articles tagged yet.</p>
          </div>
        ) : (
          <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <RevealItem key={post.id}>
                <PostCard post={post} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </SiteChrome>
  );
}
