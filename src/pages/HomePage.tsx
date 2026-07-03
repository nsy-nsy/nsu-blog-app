import { ASSET_BASE } from "../config";
import { PostCard } from "../components/PostCard";
import type { Page, Post } from "../types";

export function HomePage({ onNavigate, onOpenPost, posts }: { onNavigate: (page: Page) => void; onOpenPost: (id: string) => void; posts: Post[] }) {
  const featuredPost = posts[0];

  return (
    <>
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-5 py-12 md:px-8 md:py-20">
        <div className="col-span-12 flex flex-col justify-center md:col-span-5">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Review · Daily · Archive</p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">세웅이만의 블로그</h1>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-zinc-700 dark:text-zinc-300">
            일상에서 직접 보고 써본 것들을 차분하게 기록합니다. 신발, 컴퓨터, 생활 정보처럼 나중에 다시 찾아볼 만한 글을 남기는 개인 아카이브입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-zinc-950" type="button" onClick={() => onNavigate("posts")}>
              글목록 보기
            </button>
            <button className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => onNavigate("write")}>
              글쓰기
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <img className="h-full min-h-72 w-full rounded-xl object-cover shadow-2xl shadow-zinc-200 dark:shadow-black/50" src={`${ASSET_BASE}blog-hero.png`} alt="블로그 작업 공간" />
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-8 text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:px-8">
          <div className="col-span-12 md:col-span-4">
            <p className="font-black text-zinc-950 dark:text-white">루이의 리뷰 노트</p>
            <p className="mt-2">직접 찍은 사진과 실제 사용감을 중심으로 기록합니다.</p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="font-black text-zinc-950 dark:text-white">일상 속 취향 기록</p>
            <p className="mt-2">고프코어, 신발, 생활 제품처럼 관심 있는 것들을 모읍니다.</p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="font-black text-zinc-950 dark:text-white">검색해도 도움 되는 글</p>
            <p className="mt-2">나중에 다시 봐도 쓸모 있는 정보를 차곡차곡 남깁니다.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-14 md:px-8">
        <div className="col-span-12 mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Latest</p>
          <h2 className="mt-3 text-2xl font-black md:text-[28px]">최근 기록</h2>
        </div>
        {featuredPost && <PostCard className="col-span-12 md:col-span-7" post={featuredPost} onOpenPost={onOpenPost} />}
      </section>
    </>
  );
}
