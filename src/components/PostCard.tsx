import { BookOpen } from "lucide-react";
import { ASSET_BASE } from "../config";
import type { Post } from "../types";

function getThumbnail(post: Post) {
  const uploadedImage = post.media?.find((item) => item.type === "image")?.src;
  const image = uploadedImage ?? post.images?.[0];
  if (!image) return "";
  return image.startsWith("data:") || image.startsWith("blob:") || image.startsWith("http") ? image : `${ASSET_BASE}${image}`;
}

export function PostCard({ className, post, onOpenPost }: { className?: string; post: Post; onOpenPost: (id: string) => void }) {
  const thumbnail = getThumbnail(post);

  return (
    <article className={`${className ?? ""} rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40`}>
      <button className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl text-left" type="button" onClick={() => onOpenPost(post.id)} aria-label={`${post.title} 읽기`}>
        {thumbnail && (
          <div className="bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30">
              <img className="aspect-[16/10] w-full rounded-md object-cover" src={thumbnail} alt={`${post.title} 대표사진`} loading="lazy" />
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
          <h3 className="mt-3 text-lg font-black leading-tight md:text-xl">{post.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-zinc-950 dark:text-white">
            <BookOpen size={17} />
            읽기
          </span>
        </div>
      </button>
    </article>
  );
}
