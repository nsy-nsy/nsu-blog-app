import { BookOpen } from "lucide-react";
import type { Post } from "../types";

export function PostCard({ className, post, onOpenPost }: { className?: string; post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className={`${className ?? ""} rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950`}>
      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
      <h3 className="mt-3 text-lg font-black leading-tight md:text-xl">{post.title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
      <button className="mt-5 inline-flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white" type="button" onClick={() => onOpenPost(post.id)}>
        <BookOpen size={17} />
        읽기
      </button>
    </article>
  );
}
