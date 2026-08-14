"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileWarning } from "lucide-react";
import Editor from "@/components/editor/Editor";
import { getPost } from "@/services/postService";
import type { Post } from "@/types/post";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setPost(undefined);
    getPost(params.id).then((p) => {
      if (!cancelled) setPost(p);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (post === undefined) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-2 text-ink-400">
        <Loader2 className="animate-spin" size={22} />
        <p className="text-sm">Loading article…</p>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-2 text-ink-400">
        <FileWarning size={22} />
        <p className="text-sm">This article couldn&apos;t be found.</p>
      </div>
    );
  }

  return <Editor post={post} onPostChange={setPost} />;
}
