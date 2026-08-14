"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Editor from "@/components/editor/Editor";
import type { Post } from "@/types/post";

export default function NewPostPage() {
  const router = useRouter();
  const redirected = useRef(false);

  const handlePostChange = (post: Post) => {
    // Once the draft gets its first id, move the URL to the canonical
    // edit route without unmounting the editor or losing focus.
    if (!redirected.current) {
      redirected.current = true;
      router.replace(`/admin/edit-post/${post.id}`);
    }
  };

  return <Editor post={null} onPostChange={handlePostChange} />;
}
