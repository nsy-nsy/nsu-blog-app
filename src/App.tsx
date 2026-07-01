import { FormEvent, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Clock3, Home, List, Menu, PenLine, Search, Tag, X } from "lucide-react";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Page, Post, PostDraft } from "./types";

const STORAGE_KEY = "nsu-blog-posts-v4";
const categories: Category[] = ["블로그수익화", "AI글쓰기", "애드센스", "데이터분석", "웹개발", "인프라"];

const emptyDraft: PostDraft = {
  title: "",
  category: "블로그수익화",
  excerpt: "",
  body: "",
  tags: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

function estimateReadMinutes(body: string) {
  return Math.max(1, Math.ceil(body.replace(/\s+/g, "").length / 650));
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => cleanText(tag, 20))
    .filter(Boolean)
    .slice(0, 6);
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => safeRead(STORAGE_KEY, starterPosts));
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState("");
  const [message, setMessage] = useState("");

  const selectedPost = posts.find((post) => post.id === selectedId) ?? posts[0];

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "전체" || post.category === activeCategory;
      const text = `${post.title} ${post.excerpt} ${post.tags.join(" ")}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [activeCategory, posts, query]);

  const featuredPosts = posts.slice(0, 3);

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPost(id: string) {
    setSelectedId(id);
    navigate("posts");
  }

  function persist(nextPosts: Post[]) {
    setPosts(nextPosts);
    safeWrite(STORAGE_KEY, nextPosts);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = cleanText(draft.body, 9000);
    const nextDraft: PostDraft = {
      title: cleanText(draft.title, 90),
      category: draft.category,
      excerpt: cleanText(draft.excerpt, 220),
      body,
      tags: parseTags(tagInput),
    };

    if (!nextDraft.title || !nextDraft.excerpt || nextDraft.body.length < 120) {
      setMessage("제목, 요약, 본문 120자 이상을 채워주세요.");
      return;
    }

    const post: Post = {
      ...nextDraft,
      id: makeId(),
      createdAt: new Date().toISOString(),
      readMinutes: estimateReadMinutes(body),
      searchIntent: "직접 작성한 블로그 글",
    };

    persist([post, ...posts].slice(0, 80));
    setDraft(emptyDraft);
    setTagInput("");
    setSelectedId(post.id);
    setMessage("글이 저장되었습니다. 글목록에서 바로 확인할 수 있습니다.");
    navigate("posts");
  }

  function handleDelete(id: string) {
    const nextPosts = posts.filter((post) => post.id !== id);
    persist(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] text-zinc-950">
      <Header page={page} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onNavigate={navigate} />

      {page === "home" && <HomePage posts={featuredPosts} onOpenPost={openPost} onNavigate={navigate} />}
      {page === "posts" && (
        <PostsPage
          activeCategory={activeCategory}
          categories={categories}
          filteredPosts={filteredPosts}
          onCategoryChange={setActiveCategory}
          onDelete={handleDelete}
          onOpenPost={openPost}
          query={query}
          selectedPost={selectedPost}
          setQuery={setQuery}
        />
      )}
      {page === "write" && (
        <WritePage
          categories={categories}
          draft={draft}
          message={message}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          setTagInput={setTagInput}
          tagInput={tagInput}
        />
      )}

      <Footer onNavigate={navigate} />
    </main>
  );
}

function Header({
  page,
  menuOpen,
  onToggleMenu,
  onNavigate,
}: {
  page: Page;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNavigate: (page: Page) => void;
}) {
  const navItems: Array<{ page: Page; label: string; icon: typeof Home }> = [
    { page: "home", label: "메인페이지", icon: Home },
    { page: "posts", label: "글목록", icon: List },
    { page: "write", label: "글쓰기", icon: PenLine },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f7faf7]/92 px-5 py-4 backdrop-blur md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-4">
        <button className="col-span-8 flex items-center gap-3 text-left font-black md:col-span-4" type="button" onClick={() => onNavigate("home")}>
          <span className="grid size-11 place-items-center rounded-lg bg-zinc-950 text-sm text-white">NSU</span>
          <span className="text-lg">세웅이만의 블로그</span>
        </button>

        <nav className="col-span-8 hidden justify-center gap-2 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
                  page === item.page ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-white hover:text-zinc-950"
                }`}
                type="button"
                onClick={() => onNavigate(item.page)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="col-span-4 flex justify-end md:hidden">
          <button
            aria-label="모바일 메뉴 열기"
            aria-expanded={menuOpen}
            className="relative grid size-11 place-items-center rounded-lg border border-zinc-300 bg-white transition hover:border-zinc-950"
            type="button"
            onClick={onToggleMenu}
          >
            <Menu className={`absolute transition duration-300 ${menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={22} />
            <X className={`absolute transition duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={22} />
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          menuOpen ? "max-h-72 translate-y-0 opacity-100" : "max-h-0 -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-auto mt-4 grid max-w-7xl gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-black ${
                  page === item.page ? "bg-zinc-950 text-white" : "text-zinc-700"
                }`}
                type="button"
                onClick={() => onNavigate(item.page)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function HomePage({ posts, onOpenPost, onNavigate }: { posts: Post[]; onOpenPost: (id: string) => void; onNavigate: (page: Page) => void }) {
  return (
    <>
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-16">
        <div className="col-span-12 flex flex-col justify-center md:col-span-6">
          <p className="mb-3 text-sm font-black uppercase text-emerald-700">Blog · AI · Revenue</p>
          <h1 className="text-5xl font-black leading-tight tracking-normal md:text-7xl">세웅이만의 블로그</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            AI 도구, 블로그 수익화, 애드센스, 데이터 분석, React 웹개발을 직접 만들며 기록하는 실전 블로그입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="rounded-lg bg-zinc-950 px-5 py-3 font-black text-white" type="button" onClick={() => onNavigate("posts")}>
              글목록 보기
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-black" type="button" onClick={() => onNavigate("write")}>
              글쓰기
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6">
          <img
            className="h-full min-h-72 w-full rounded-lg object-cover shadow-2xl shadow-zinc-200"
            src="/blog-hero.png"
            alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간"
          />
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-12 divide-y divide-zinc-200 px-5 md:divide-x md:divide-y-0 md:px-8">
          <Stat className="col-span-12 md:col-span-3" label="기본 글" value="5개" />
          <Stat className="col-span-12 md:col-span-3" label="검색 주제" value="SEO형" />
          <Stat className="col-span-12 md:col-span-3" label="레이아웃" value="12컬럼" />
          <Stat className="col-span-12 md:col-span-3" label="상태" value="개선중" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-14 md:px-8">
        <div className="col-span-12 mb-2">
          <p className="text-sm font-black uppercase text-emerald-700">Featured</p>
          <h2 className="mt-2 text-4xl font-black">먼저 읽기 좋은 글</h2>
        </div>
        {posts.map((post) => (
          <PostCard key={post.id} className="col-span-12 md:col-span-4" post={post} onOpenPost={onOpenPost} />
        ))}
      </section>
    </>
  );
}

function PostsPage({
  activeCategory,
  categories,
  filteredPosts,
  onCategoryChange,
  onDelete,
  onOpenPost,
  query,
  selectedPost,
  setQuery,
}: {
  activeCategory: Category | "전체";
  categories: Category[];
  filteredPosts: Post[];
  onCategoryChange: (category: Category | "전체") => void;
  onDelete: (id: string) => void;
  onOpenPost: (id: string) => void;
  query: string;
  selectedPost?: Post;
  setQuery: (query: string) => void;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12">
        <p className="text-sm font-black uppercase text-emerald-700">Posts</p>
        <h1 className="mt-2 text-4xl font-black md:text-6xl">글목록</h1>
      </div>

      <aside className="col-span-12 space-y-4 md:col-span-4">
        <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <Search size={18} className="text-zinc-500" />
          <input
            className="w-full bg-transparent outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색어 입력"
          />
        </label>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-black">카테고리</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["전체", ...categories] as const).map((category) => (
              <button
                key={category}
                className={`rounded-lg border px-3 py-2 text-sm font-black ${
                  activeCategory === category ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white"
                }`}
                type="button"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {filteredPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onOpenPost(post.id)}
              className={`rounded-lg border p-4 text-left transition ${
                selectedPost?.id === post.id ? "border-emerald-700 bg-emerald-50" : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <span className="text-xs font-black text-emerald-700">{post.category}</span>
              <strong className="mt-2 block leading-snug">{post.title}</strong>
              <span className="mt-2 block text-sm text-zinc-600">{post.readMinutes}분 읽기</span>
            </button>
          ))}
        </div>
      </aside>

      <article className="col-span-12 rounded-lg border border-zinc-200 bg-white p-6 md:col-span-8 md:p-8">
        {selectedPost ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-emerald-700">{selectedPost.category}</p>
                <h2 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{selectedPost.title}</h2>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-zinc-500">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={16} /> {formatDate(selectedPost.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 size={16} /> {selectedPost.readMinutes}분</span>
                </div>
              </div>
              {!selectedPost.id.includes("-") && (
                <button
                  type="button"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700"
                  onClick={() => onDelete(selectedPost.id)}
                >
                  삭제
                </button>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
            <p className="mt-8 border-l-4 border-emerald-600 pl-4 text-lg font-bold text-zinc-700">{selectedPost.excerpt}</p>
            <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-zinc-800">{selectedPost.body}</div>
          </>
        ) : (
          <p className="text-zinc-600">검색 결과가 없습니다.</p>
        )}
      </article>
    </section>
  );
}

function WritePage({
  categories,
  draft,
  message,
  onDraftChange,
  onSubmit,
  setTagInput,
  tagInput,
}: {
  categories: Category[];
  draft: PostDraft;
  message: string;
  onDraftChange: (draft: PostDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setTagInput: (tags: string) => void;
  tagInput: string;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12 md:col-span-4">
        <p className="text-sm font-black uppercase text-emerald-700">Write</p>
        <h1 className="mt-2 text-4xl font-black leading-tight md:text-6xl">글쓰기</h1>
        <p className="mt-5 leading-8 text-zinc-700">
          작성한 글은 현재 브라우저에 저장됩니다. 입력값은 길이 제한과 제어문자 제거를 거치고, 본문은 HTML로 실행되지 않습니다.
        </p>
      </div>

      <form className="col-span-12 grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 md:col-span-8" onSubmit={onSubmit}>
        <label className="grid gap-2 font-bold">
          제목
          <input
            className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
            value={draft.title}
            maxLength={90}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            placeholder="예: 애드센스 승인 전 꼭 준비해야 할 5가지"
          />
        </label>
        <label className="grid gap-2 font-bold">
          카테고리
          <select
            className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
            value={draft.category}
            onChange={(event) => onDraftChange({ ...draft, category: event.target.value as Category })}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 font-bold">
          요약
          <input
            className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
            value={draft.excerpt}
            maxLength={220}
            onChange={(event) => onDraftChange({ ...draft, excerpt: event.target.value })}
            placeholder="글목록에 보일 짧은 설명"
          />
        </label>
        <label className="grid gap-2 font-bold">
          태그
          <input
            className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
            value={tagInput}
            maxLength={120}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="예: 애드센스, SEO, 블로그"
          />
        </label>
        <label className="grid gap-2 font-bold">
          본문
          <textarea
            className="min-h-72 resize-y rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
            value={draft.body}
            maxLength={9000}
            onChange={(event) => onDraftChange({ ...draft, body: event.target.value })}
            placeholder="본문을 입력하세요."
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-600">{message || "본문은 최소 120자 이상 권장합니다."}</p>
          <button className="rounded-lg bg-zinc-950 px-5 py-3 font-black text-white" type="submit">
            글 저장
          </button>
        </div>
      </form>
    </section>
  );
}

function PostCard({ className, post, onOpenPost }: { className?: string; post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className={`${className ?? ""} rounded-lg border border-zinc-200 bg-white p-5`}>
      <p className="text-sm font-black text-emerald-700">{post.category}</p>
      <h3 className="mt-3 text-2xl font-black leading-tight">{post.title}</h3>
      <p className="mt-3 leading-7 text-zinc-700">{post.excerpt}</p>
      <button className="mt-5 inline-flex items-center gap-2 font-black text-zinc-950" type="button" onClick={() => onOpenPost(post.id)}>
        <BookOpen size={17} />
        읽기
      </button>
    </article>
  );
}

function Stat({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`${className ?? ""} p-6`}>
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="text-sm font-bold text-zinc-600">{label}</span>
    </div>
  );
}

function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 px-5 py-10 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <div className="flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center rounded-lg bg-white text-sm text-zinc-950">NSU</span>
            <span>세웅이만의 블로그</span>
          </div>
          <p className="mt-4 max-w-xl leading-7 text-zinc-300">
            AI와 웹개발을 직접 실험하며 블로그 수익화까지 기록하는 개인 블로그입니다.
          </p>
        </div>
        <div className="col-span-12 flex flex-wrap gap-2 md:col-span-6 md:justify-end">
          <button className="rounded-lg border border-zinc-700 px-4 py-2 font-bold text-zinc-200" type="button" onClick={() => onNavigate("home")}>
            메인페이지
          </button>
          <button className="rounded-lg border border-zinc-700 px-4 py-2 font-bold text-zinc-200" type="button" onClick={() => onNavigate("posts")}>
            글목록
          </button>
          <button className="rounded-lg border border-zinc-700 px-4 py-2 font-bold text-zinc-200" type="button" onClick={() => onNavigate("write")}>
            글쓰기
          </button>
        </div>
      </div>
    </footer>
  );
}
