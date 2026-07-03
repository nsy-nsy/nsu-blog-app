import { Tag } from "lucide-react";
import type { Post } from "../types";
import { formatDate } from "../utils/blog";

export function DetailPage({ isLoggedIn, onBack, onDelete, post }: { isLoggedIn: boolean; onBack: () => void; onDelete: (id: string) => void; post?: Post }) {
  if (!post) {
    return (
      <section className="mx-auto grid max-w-7xl grid-cols-12 px-5 py-14 md:px-8">
        <div className="col-span-12 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-300">선택한 글이 없습니다.</p>
          <button className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="button" onClick={onBack}>
            글목록으로
          </button>
        </div>
      </section>
    );
  }

  const isUserPost = !post.id.includes("-");

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
      <button className="mb-8 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" type="button" onClick={onBack}>
        ← 글목록
      </button>

      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
          <span>
            <em className="font-serif italic">by</em> <strong className="text-zinc-800 dark:text-zinc-200">세웅</strong>
          </span>
          <span className="inline-flex gap-4">
            <span>{formatDate(post.createdAt)}</span>
            <span>{post.readMinutes}분 읽기</span>
          </span>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <Tag size={12} /> {tag}
          </span>
        ))}
      </div>

      <div className="mt-10 whitespace-pre-wrap text-[15.5px] leading-8 text-zinc-850 dark:text-zinc-100 md:text-base">{post.body}</div>

      <footer className="mt-12 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Search intent</p>
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{post.searchIntent}</p>
        {isLoggedIn && isUserPost && (
          <button
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
            type="button"
            onClick={() => {
              onDelete(post.id);
              onBack();
            }}
          >
            삭제
          </button>
        )}
      </footer>
    </article>
  );
}
