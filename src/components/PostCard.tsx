import { BookOpen } from "lucide-react";
import type { Post } from "../types";

export function PostCard({ className, post, onOpenPost }: { className?: string; post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className={`${className ?? ""} rounded-xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40`}>
      <button className="block h-full w-full cursor-pointer text-left" type="button" onClick={() => onOpenPost(post.id)} aria-label={`${post.title} 읽기`}>
        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h3 className="mt-3 text-lg font-black leading-tight md:text-xl">{post.title}</h3>
        <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white">
          <BookOpen size={17} />
          읽기
        </span>
      </button>
    </article>
  );
}
