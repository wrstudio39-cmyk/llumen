"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { PublicPost } from "@/lib/publicData";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function PostCard({ post, featured = false }: { post: PublicPost; featured?: boolean }) {
  const category = post.categories[0];

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group flex flex-col overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-soft hover:shadow-floating dark:border-ink-800 dark:bg-ink-900 ${
        featured ? "md:flex-row" : ""
      }`}
    >
      <Link href={`/blog/${post.slug}`} className="contents">
        <div className={`relative overflow-hidden bg-ink-100 dark:bg-ink-800 ${featured ? "aspect-[16/10] md:aspect-auto md:w-1/2" : "aspect-[16/10]"}`}>
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300">No image</div>
          )}
        </div>

        <div className={`flex flex-1 flex-col p-6 ${featured ? "md:justify-center md:p-8" : ""}`}>
          {category && (
            <span className="w-fit rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
              {category.name}
            </span>
          )}
          <h3
            className={`mt-3 font-semibold leading-snug tracking-tight text-ink-900 transition-colors group-hover:text-accent-700 dark:text-white dark:group-hover:text-accent-300 ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className={`mt-2 text-ink-500 dark:text-ink-400 ${featured ? "text-base" : "line-clamp-2 text-sm"}`}>
              {post.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-ink-400">
            {post.author && <span className="font-medium text-ink-500 dark:text-ink-300">{post.author.name}</span>}
            <span>·</span>
            <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
            <span className="flex items-center gap-1">
              <span>·</span>
              <Clock size={12} /> {post.readingTimeMinutes} min
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
