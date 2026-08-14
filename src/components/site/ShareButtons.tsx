"use client";

import { useState } from "react";
import { Link2, Twitter, Facebook, Check } from "lucide-react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-accent-300 hover:text-accent-600 dark:border-ink-700 dark:text-ink-300";

  return (
    <div className="flex items-center gap-2">
      <a href={twitterHref} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Share on X">
        <Twitter size={15} />
      </a>
      <a href={facebookHref} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Share on Facebook">
        <Facebook size={15} />
      </a>
      <button onClick={copyLink} className={btn} aria-label="Copy link">
        {copied ? <Check size={15} /> : <Link2 size={15} />}
      </button>
    </div>
  );
}
