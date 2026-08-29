import { CalendarDays, Clock3 } from "lucide-react";
import { ASSET_BASE } from "../config";
import type { Post } from "../types";
import { formatDate } from "../utils/blog";

function getThumbnail(post: Post) {
  const uploadedImage = post.media?.find((item) => item.type === "image")?.src;
  const image = uploadedImage ?? post.images?.[0];
  if (!image) return "";
  return image.startsWith("data:") || image.startsWith("blob:") || image.startsWith("http") ? image : `${ASSET_BASE}${image}`;
}

export function PostListCard({ post, onOpenPost }: { post: Post; onOpenPost: (id: string) => void }) {
  const thumbnail = getThumbnail(post);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40">
      <button className={`grid w-full gap-0 overflow-hidden rounded-xl text-left ${thumbnail ? "grid-cols-[7.25rem_minmax(0,1fr)] md:grid-cols-12" : "grid-cols-1"}`} type="button" onClick={() => onOpenPost(post.id)}>
        {thumbnail && (
          <div className="flex min-h-full items-center justify-center bg-zinc-50 p-2.5 dark:bg-zinc-900/60 md:col-span-4 md:p-4">
            <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30">
              <img className="aspect-square w-full rounded-md object-cover md:aspect-[4/3]" src={thumbnail} alt={`${post.title} 대표사진`} loading="lazy" />
            </div>
          </div>
        )}
        <div className={`${thumbnail ? "min-w-0 md:col-span-8" : ""} p-4 md:p-6`}>
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
          <h2 className="mt-2 text-base font-black leading-tight md:mt-3 md:text-2xl">{post.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300 md:mt-3 md:text-[15px] md:leading-7">{post.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-500 md:mt-5 md:gap-3">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={15} /> {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={15} /> {post.readMinutes}분
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
