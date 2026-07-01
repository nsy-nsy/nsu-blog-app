import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Clock3, Home, List, Menu, Moon, PenLine, Search, Sun, Tag, X } from "lucide-react";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Page, Post, PostDraft } from "./types";

type Theme = "light" | "dark";

const STORAGE_KEY = "nsu-blog-posts-v5";
const categories: Category[] = ["블로그수익화", "AI글쓰기", "애드센스", "데이터분석", "웹개발", "인프라"];

const emptyDraft: PostDraft = {
  title: "",
  category: "블로그수익화",
  excerpt: "",
  body: "",
  tags: [],
};

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

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
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme());
  const [posts, setPosts] = useState<Post[]>(() => safeRead(STORAGE_KEY, starterPosts));
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
    navigate("detail");
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
    setMessage("글이 저장되었습니다.");
    navigate("detail");
  }

  function handleDelete(id: string) {
    const nextPosts = posts.filter((post) => post.id !== id);
    persist(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950 transition-colors dark:bg-[#050505] dark:text-zinc-50">
      <Header
        menuOpen={menuOpen}
        onNavigate={navigate}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        page={page}
        theme={theme}
      />

      {page === "home" && <HomePage onNavigate={navigate} onOpenPost={openPost} posts={featuredPosts} />}
      {page === "posts" && (
        <PostsPage
          activeCategory={activeCategory}
          categories={categories}
          filteredPosts={filteredPosts}
          onCategoryChange={setActiveCategory}
          onOpenPost={openPost}
          query={query}
          setQuery={setQuery}
        />
      )}
      {page === "detail" && <DetailPage onBack={() => navigate("posts")} onDelete={handleDelete} post={selectedPost} />}
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
  menuOpen,
  onNavigate,
  onToggleMenu,
  onToggleTheme,
  page,
  theme,
}: {
  menuOpen: boolean;
  onNavigate: (page: Page) => void;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
  page: Page;
  theme: Theme;
}) {
  const navItems: Array<{ page: Page; label: string; icon: typeof Home }> = [
    { page: "home", label: "메인페이지", icon: Home },
    { page: "posts", label: "글목록", icon: List },
    { page: "write", label: "글쓰기", icon: PenLine },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f7f7f5]/92 px-5 py-5 backdrop-blur-xl transition-colors dark:border-zinc-800 dark:bg-[#050505]/88 md:px-8 md:py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-4">
        <button className="col-span-8 flex items-center gap-4 text-left font-black md:col-span-4" type="button" onClick={() => onNavigate("home")}>
          <span className="grid size-12 place-items-center rounded-xl bg-zinc-950 text-sm text-white dark:bg-white dark:text-zinc-950 md:size-14">NSU</span>
          <span className="text-xl tracking-tight md:text-2xl">세웅이만의 블로그</span>
        </button>

        <nav className="col-span-6 hidden justify-center gap-2 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.page || (page === "detail" && item.page === "posts");
            return (
              <button
                key={item.page}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  active
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 hover:bg-white hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
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

        <div className="col-span-4 flex justify-end gap-2 md:col-span-2">
          <button
            aria-label={theme === "dark" ? "라이트모드로 변경" : "다크모드로 변경"}
            className="relative grid size-11 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-950 transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-400"
            type="button"
            onClick={onToggleTheme}
          >
            <Sun className={`absolute transition duration-300 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={20} />
            <Moon className={`absolute transition duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={20} />
          </button>
          <button
            aria-expanded={menuOpen}
            aria-label="모바일 메뉴 열기"
            className="relative grid size-11 place-items-center rounded-xl border border-zinc-300 bg-white transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-400 md:hidden"
            type="button"
            onClick={onToggleMenu}
          >
            <Menu className={`absolute transition duration-300 ${menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={22} />
            <X className={`absolute transition duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={22} />
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${menuOpen ? "max-h-72 translate-y-0 opacity-100" : "max-h-0 -translate-y-2 opacity-0"}`}>
        <nav className="mx-auto mt-4 grid max-w-7xl gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.page || (page === "detail" && item.page === "posts");
            return (
              <button
                key={item.page}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black ${
                  active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-700 dark:text-zinc-300"
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

function HomePage({ onNavigate, onOpenPost, posts }: { onNavigate: (page: Page) => void; onOpenPost: (id: string) => void; posts: Post[] }) {
  return (
    <>
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-12 md:px-8 md:py-20">
        <div className="col-span-12 flex flex-col justify-center md:col-span-6">
          <p className="mb-3 text-sm font-black uppercase text-emerald-700 dark:text-emerald-400">Blog · AI · Revenue</p>
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">세웅이만의 블로그</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            AI 도구, 블로그 수익화, 애드센스, 데이터 분석, React 웹개발을 직접 만들며 기록하는 실전 블로그입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="button" onClick={() => onNavigate("posts")}>
              글목록 보기
            </button>
            <button className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-black dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => onNavigate("write")}>
              글쓰기
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6">
          <img className="h-full min-h-72 w-full rounded-xl object-cover shadow-2xl shadow-zinc-200 dark:shadow-black/50" src="/blog-hero.png" alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간" />
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

      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-14 md:px-8">
        <div className="col-span-12 mb-2">
          <p className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-400">Featured</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">먼저 읽기 좋은 글</h2>
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
  onOpenPost,
  query,
  setQuery,
}: {
  activeCategory: Category | "전체";
  categories: Category[];
  filteredPosts: Post[];
  onCategoryChange: (category: Category | "전체") => void;
  onOpenPost: (id: string) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12 md:col-span-3">
        <p className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-400">Posts</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">글목록</h1>
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
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
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

function PostListCard({ post, onOpenPost }: { post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40 md:p-7">
      <button className="block w-full text-left" type="button" onClick={() => onOpenPost(post.id)}>
        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight md:text-3xl">{post.title}</h2>
        <p className="mt-3 line-clamp-2 leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1"><CalendarDays size={15} /> {formatDate(post.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={15} /> {post.readMinutes}분</span>
        </div>
      </button>
    </article>
  );
}

function DetailPage({ onBack, onDelete, post }: { onBack: () => void; onDelete: (id: string) => void; post?: Post }) {
  if (!post) {
    return (
      <section className="mx-auto grid max-w-7xl grid-cols-12 px-5 py-14 md:px-8">
        <div className="col-span-12 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-300">선택된 글이 없습니다.</p>
          <button className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="button" onClick={onBack}>
            글목록으로
          </button>
        </div>
      </section>
    );
  }

  const isUserPost = !post.id.includes("-");

  return (
    <article className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-20">
      <button className="mb-10 rounded-full border border-zinc-300 bg-white px-5 py-3 font-black text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" type="button" onClick={onBack}>
        ← 글목록
      </button>

      <header className="border-b border-zinc-200 pb-10 dark:border-zinc-800">
        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
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

      <div className="mt-12 whitespace-pre-wrap text-[18px] leading-10 text-zinc-850 dark:text-zinc-100 md:text-[19px]">{post.body}</div>

      <footer className="mt-14 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Search intent</p>
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{post.searchIntent}</p>
        {isUserPost && (
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
        <p className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-400">Write</p>
        <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight md:text-6xl">글쓰기</h1>
        <p className="mt-5 leading-8 text-zinc-700 dark:text-zinc-300">
          작성한 글은 현재 브라우저에 저장됩니다. 입력값은 길이 제한과 제어문자 제거를 거치고, 본문은 HTML로 실행되지 않습니다.
        </p>
      </div>

      <form className="col-span-12 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:col-span-8" onSubmit={onSubmit}>
        <FormInput label="제목" maxLength={90} onChange={(value) => onDraftChange({ ...draft, title: value })} placeholder="예: 애드센스 승인 전 꼭 준비해야 할 5가지" value={draft.title} />
        <label className="grid gap-2 font-bold">
          카테고리
          <select className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={draft.category} onChange={(event) => onDraftChange({ ...draft, category: event.target.value as Category })}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <FormInput label="요약" maxLength={220} onChange={(value) => onDraftChange({ ...draft, excerpt: value })} placeholder="글목록에 보일 짧은 설명" value={draft.excerpt} />
        <FormInput label="태그" maxLength={120} onChange={setTagInput} placeholder="예: 애드센스, SEO, 블로그" value={tagInput} />
        <label className="grid gap-2 font-bold">
          본문
          <textarea className="min-h-72 resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={draft.body} maxLength={9000} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="본문을 입력하세요." />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{message || "본문은 최소 120자 이상 권장합니다."}</p>
          <button className="rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="submit">
            글 저장
          </button>
        </div>
      </form>
    </section>
  );
}

function FormInput({ label, maxLength, onChange, placeholder, value }: { label: string; maxLength: number; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function PostCard({ className, post, onOpenPost }: { className?: string; post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className={`${className ?? ""} rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950`}>
      <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
      <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight">{post.title}</h3>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
      <button className="mt-5 inline-flex items-center gap-2 font-black text-zinc-950 dark:text-white" type="button" onClick={() => onOpenPost(post.id)}>
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
      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 px-5 py-10 text-white dark:border-zinc-800 dark:bg-black md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <div className="flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-sm text-zinc-950">NSU</span>
            <span>세웅이만의 블로그</span>
          </div>
          <p className="mt-4 max-w-xl leading-7 text-zinc-300">
            AI와 웹개발을 직접 실험하며 블로그 수익화까지 기록하는 개인 블로그입니다.
          </p>
        </div>
        <div className="col-span-12 flex flex-wrap gap-2 md:col-span-6 md:justify-end">
          {(["home", "posts", "write"] as Page[]).map((target) => (
            <button key={target} className="rounded-xl border border-zinc-700 px-4 py-2 font-bold text-zinc-200" type="button" onClick={() => onNavigate(target)}>
              {target === "home" ? "메인페이지" : target === "posts" ? "글목록" : "글쓰기"}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
