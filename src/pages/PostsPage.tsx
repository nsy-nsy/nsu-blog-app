import { Search } from "lucide-react";
import { PostListCard } from "../components/PostListCard";
import type { Category, Post } from "../types";

type PostsPageProps = {
  activeCategory: Category | "전체";
  categories: Category[];
  filteredPosts: Post[];
  onCategoryChange: (category: Category | "전체") => void;
  onOpenPost: (id: string) => void;
  query: string;
  setQuery: (query: string) => void;
};

export function PostsPage({ activeCategory, categories, filteredPosts, onCategoryChange, onOpenPost, query, setQuery }: PostsPageProps) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-9 md:px-8 md:py-12">
      <div className="col-span-12 md:col-span-3">
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Posts</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">글목록</h1>
      </div>

      <div className="col-span-12 space-y-4 md:col-span-9">
        <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <Search size={18} className="text-zinc-500" />
          <input className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어 입력" />
        </label>

        <div className="flex flex-wrap gap-2">
          {(["전체", ...categories] as const).map((category) => (
            <button
              key={category}
              className={`rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${
                activeCategory === category
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              }`}
              type="button"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostListCard key={post.id} post={post} onOpenPost={onOpenPost} />)
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">검색 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}
