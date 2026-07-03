import { ASSET_BASE } from "../config";
import { PostCard } from "../components/PostCard";
import { Stat } from "../components/Stat";
import type { Page, Post } from "../types";

export function HomePage({ onNavigate, onOpenPost, posts }: { onNavigate: (page: Page) => void; onOpenPost: (id: string) => void; posts: Post[] }) {
  return (
    <>
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-16">
        <div className="col-span-12 flex flex-col justify-center md:col-span-6">
          <p className="mb-3 text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Blog · AI · Revenue</p>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">세웅이만의 블로그</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300 md:text-[15px]">
            AI 도구, 블로그 수익화, 애드센스, 데이터 분석, React 웹개발을 직접 만들며 기록하는 실전 블로그입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-zinc-950" type="button" onClick={() => onNavigate("posts")}>
              글목록 보기
            </button>
            <button className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => onNavigate("write")}>
              글쓰기
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6">
          <img className="h-full min-h-64 w-full rounded-xl object-cover shadow-2xl shadow-zinc-200 dark:shadow-black/50" src={`${ASSET_BASE}blog-hero.png`} alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간" />
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl grid-cols-12 divide-y divide-zinc-200 px-5 dark:divide-zinc-800 md:divide-x md:divide-y-0 md:px-8">
          <Stat className="col-span-12 md:col-span-3" label="기본 글" value="5개" />
          <Stat className="col-span-12 md:col-span-3" label="검색 주제" value="SEO형" />
          <Stat className="col-span-12 md:col-span-3" label="레이아웃" value="12컬럼" />
          <Stat className="col-span-12 md:col-span-3" label="테마" value="자동" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-12 md:px-8">
        <div className="col-span-12 mb-2">
          <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Featured</p>
          <h2 className="mt-2 text-2xl font-black md:text-[28px]">먼저 읽기 좋은 글</h2>
        </div>
        {posts.map((post) => (
          <PostCard key={post.id} className="col-span-12 md:col-span-4" post={post} onOpenPost={onOpenPost} />
        ))}
      </section>
    </>
  );
}
