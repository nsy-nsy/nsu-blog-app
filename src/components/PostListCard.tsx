import { CalendarDays, Clock3 } from "lucide-react";
import type { Post } from "../types";
import { formatDate } from "../utils/blog";

export function PostListCard({ post, onOpenPost }: { post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40 md:p-6">
      <button className="block w-full text-left" type="button" onClick={() => onOpenPost(post.id)}>
        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h2 className="mt-3 text-lg font-black leading-tight md:text-2xl">{post.title}</h2>
        <p className="mt-3 line-clamp-2 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={15} /> {formatDate(post.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={15} /> {post.readMinutes}분
          </span>
        </div>
      </button>
    </article>
  );
}
