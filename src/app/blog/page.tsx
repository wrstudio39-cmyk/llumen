import type { Metadata } from "next";
import SiteChrome from "@/components/site/SiteChrome";
import PostCard from "@/components/site/PostCard";
import { RevealGroup, RevealItem } from "@/components/site/Reveal";
import { getPublishedPosts } from "@/lib/publicData";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "All articles",
  description: "Every article published on Lumen — reproductive health, contraception, and relationships, clearly explained.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts(200);

  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">
          All articles
        </h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">{posts.length} published articles</p>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-xl2 border border-dashed border-ink-200 bg-white p-14 text-center dark:border-ink-800 dark:bg-ink-900">
            <p className="text-ink-400">Nothing published yet — check back soon.</p>
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
