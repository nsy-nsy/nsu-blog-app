import { Home, List } from "lucide-react";
import type { Page } from "../types";

type NotFoundPageProps = {
  onNavigate: (page: Page) => void;
};

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-20 sm:px-8 lg:px-0">
      <div className="border-y border-zinc-200 py-12 dark:border-zinc-800">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-emerald-500">404</p>
        <h1 className="mt-4 text-4xl font-black text-zinc-950 dark:text-white">페이지를 찾을 수 없습니다</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
          주소가 바뀌었거나 지금 블로그에서 제공하지 않는 페이지입니다. 아래 버튼으로 현재 공개된 글을 다시 확인할 수 있습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-900 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-100"
          onClick={() => onNavigate("home")}
          type="button"
        >
          <Home size={16} />
          메인으로
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-900 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-100"
          onClick={() => onNavigate("posts")}
          type="button"
        >
          <List size={16} />
          글목록
        </button>
      </div>
    </section>
  );
}
