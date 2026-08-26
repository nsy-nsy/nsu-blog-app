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
      <button className="grid w-full grid-cols-12 gap-0 overflow-hidden rounded-xl text-left" type="button" onClick={() => onOpenPost(post.id)}>
        {thumbnail && (
          <div className="col-span-12 flex items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900/60 md:col-span-4">
            <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30">
              <img className="aspect-[4/3] w-full rounded-md object-cover" src={thumbnail} alt={`${post.title} 대표사진`} loading="lazy" />
            </div>
          </div>
        )}
        <div className={`${thumbnail ? "col-span-12 md:col-span-8" : "col-span-12"} p-5 md:p-6`}>
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
        </div>
      </button>
    </article>
  );
}
