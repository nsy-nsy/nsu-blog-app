import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Clock3, Home, List, LogIn, LogOut, Menu, Moon, PenLine, Search, ShieldCheck, Sun, Tag, X } from "lucide-react";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Page, Post, PostDraft } from "./types";

type Theme = "light" | "dark";

const STORAGE_KEY = "nsu-blog-posts-v5";
const AUTH_KEY = "nsu-blog-auth-v1";
const AUTH_HASH_KEY = "nsu-blog-owner-hash-v1";
const OWNER_ID = "seung";
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

function getInitialAuth() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_KEY) === "owner";
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

async function hashPasscode(value: string) {
  const encoded = new TextEncoder().encode(value);
  const buffer = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => getInitialAuth());
  const [loginId, setLoginId] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [ownerConfigured, setOwnerConfigured] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(AUTH_HASH_KEY));
  });

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
    if (nextPage === "write" && !isLoggedIn) {
      setLoginMessage("글쓰기는 로그인 후 사용할 수 있습니다.");
      setPage("login");
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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

    if (!isLoggedIn) {
      setLoginMessage("로그인 후 글을 작성할 수 있습니다.");
      navigate("login");
      return;
    }

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
    if (!isLoggedIn) return;
    const nextPosts = posts.filter((post) => post.id !== id);
    persist(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? "");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedId = cleanText(loginId, 24).toLowerCase();
    const normalizedPasscode = cleanText(loginPasscode, 40);

    if (normalizedId !== OWNER_ID || normalizedPasscode.length < 8) {
      setLoginMessage("아이디는 seung, 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    const passcodeHash = await hashPasscode(normalizedPasscode);
    const savedHash = window.localStorage.getItem(AUTH_HASH_KEY);

    if (!savedHash) {
      window.localStorage.setItem(AUTH_HASH_KEY, passcodeHash);
      setOwnerConfigured(true);
      window.sessionStorage.setItem(AUTH_KEY, "owner");
      setIsLoggedIn(true);
      setLoginId("");
      setLoginPasscode("");
      setLoginMessage("관리자 비밀번호가 설정되었습니다.");
      navigate("write");
      return;
    }

    if (savedHash === passcodeHash) {
      window.sessionStorage.setItem(AUTH_KEY, "owner");
      setIsLoggedIn(true);
      setLoginId("");
      setLoginPasscode("");
      setLoginMessage("로그인되었습니다.");
      navigate("write");
      return;
    }

    setLoginMessage("아이디 또는 비밀번호가 맞지 않습니다.");
  }

  function handleLogout() {
    window.sessionStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
    setMessage("");
    if (page === "write") navigate("home");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950 transition-colors dark:bg-[#050505] dark:text-zinc-50">
      <Header
        menuOpen={menuOpen}
        isLoggedIn={isLoggedIn}
        onNavigate={navigate}
        onLogout={handleLogout}
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
      {page === "detail" && <DetailPage isLoggedIn={isLoggedIn} onBack={() => navigate("posts")} onDelete={handleDelete} post={selectedPost} />}
      {page === "login" && (
        <LoginPage
          loginId={loginId}
          loginMessage={loginMessage}
          loginPasscode={loginPasscode}
          ownerConfigured={ownerConfigured}
          onLogin={handleLogin}
          setLoginId={setLoginId}
          setLoginPasscode={setLoginPasscode}
        />
      )}
      {page === "write" && isLoggedIn && (
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
  isLoggedIn,
  menuOpen,
  onNavigate,
  onLogout,
  onToggleMenu,
  onToggleTheme,
  page,
  theme,
}: {
  isLoggedIn: boolean;
  menuOpen: boolean;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
  page: Page;
  theme: Theme;
}) {
  const navItems: Array<{ page: Page; label: string; icon: typeof Home }> = [
    { page: "home", label: "메인페이지", icon: Home },
    { page: "posts", label: "글목록", icon: List },
    { page: isLoggedIn ? "write" : "login", label: "글쓰기", icon: PenLine },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/94 px-5 py-4 backdrop-blur-xl transition-colors dark:border-[#24344d] dark:bg-[#1e3553]/96 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-4">
        <button className="col-span-8 flex min-w-0 items-center text-left md:col-span-4" type="button" onClick={() => onNavigate("home")}>
          <span className="min-w-0">
            <span className="block truncate text-[22px] font-black leading-none text-zinc-950 dark:text-white md:text-2xl">NSU BLOG<span className="text-emerald-500">.</span></span>
            <span className="mt-1 hidden text-[11px] font-semibold text-zinc-500 dark:text-slate-200 sm:block">세웅이만의 블로그</span>
          </span>
        </button>

        <div className="col-span-6 hidden items-center justify-end gap-8 md:flex">
          <nav className="flex items-center gap-7" aria-label="주요 메뉴">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.page || (page === "detail" && item.page === "posts") || (page === "login" && item.page === "login");
              return (
                <button
                  key={item.page}
                  className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${
                    active
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-zinc-700 hover:text-zinc-950 dark:text-slate-100 dark:hover:text-white"
                  }`}
                  type="button"
                  onClick={() => onNavigate(item.page)}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {isLoggedIn ? (
            <button className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-zinc-700 transition hover:text-zinc-950 dark:text-slate-100 dark:hover:text-white" type="button" onClick={onLogout}>
              <LogOut size={15} />
              로그아웃
            </button>
          ) : (
            <button className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${page === "login" ? "text-emerald-600 dark:text-emerald-300" : "text-zinc-700 hover:text-zinc-950 dark:text-slate-100 dark:hover:text-white"}`} type="button" onClick={() => onNavigate("login")}>
              <LogIn size={15} />
              로그인
            </button>
          )}
        </div>

        <div className="col-span-4 flex shrink-0 justify-end gap-2 md:col-span-2">
          <button
            aria-label={theme === "dark" ? "라이트모드로 변경" : "다크모드로 변경"}
            className="relative grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-950 transition hover:border-zinc-950 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-white/60"
            type="button"
            onClick={onToggleTheme}
          >
            <Sun className={`absolute transition duration-300 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={20} />
            <Moon className={`absolute transition duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={20} />
          </button>
          <button
            aria-expanded={menuOpen}
            aria-label="모바일 메뉴 열기"
            className="relative grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-400 md:hidden"
            type="button"
            onClick={onToggleMenu}
          >
            <Menu className={`absolute transition duration-300 ${menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={22} />
            <X className={`absolute transition duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={22} />
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${menuOpen ? "max-h-96 translate-y-0 opacity-100" : "max-h-0 -translate-y-2 opacity-0"}`}>
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
          {isLoggedIn ? (
            <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black text-zinc-700 dark:text-zinc-300" type="button" onClick={onLogout}>
              <LogOut size={18} />
              로그아웃
            </button>
          ) : (
            <button className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black ${page === "login" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-700 dark:text-zinc-300"}`} type="button" onClick={() => onNavigate("login")}>
              <LogIn size={18} />
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function HomePage({ onNavigate, onOpenPost, posts }: { onNavigate: (page: Page) => void; onOpenPost: (id: string) => void; posts: Post[] }) {
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
          <img className="h-full min-h-64 w-full rounded-xl object-cover shadow-2xl shadow-zinc-200 dark:shadow-black/50" src="/blog-hero.png" alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간" />
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

function PostListCard({ post, onOpenPost }: { post: Post; onOpenPost: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg hover:shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500 dark:hover:shadow-black/40 md:p-6">
      <button className="block w-full text-left" type="button" onClick={() => onOpenPost(post.id)}>
        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h2 className="mt-3 text-lg font-black leading-tight md:text-2xl">{post.title}</h2>
        <p className="mt-3 line-clamp-2 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1"><CalendarDays size={15} /> {formatDate(post.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={15} /> {post.readMinutes}분</span>
        </div>
      </button>
    </article>
  );
}

function DetailPage({ isLoggedIn, onBack, onDelete, post }: { isLoggedIn: boolean; onBack: () => void; onDelete: (id: string) => void; post?: Post }) {
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

function LoginPage({
  loginId,
  loginMessage,
  loginPasscode,
  ownerConfigured,
  onLogin,
  setLoginId,
  setLoginPasscode,
}: {
  loginId: string;
  loginMessage: string;
  loginPasscode: string;
  ownerConfigured: boolean;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  setLoginId: (value: string) => void;
  setLoginPasscode: (value: string) => void;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-16">
      <div className="col-span-12 flex flex-col justify-center md:col-span-5">
        <p className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">Owner Access</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">로그인 후 글을 작성하세요</h1>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-zinc-650 dark:text-slate-300">
          글쓰기는 관리자만 사용할 수 있습니다. 처음 로그인할 때 사용할 비밀번호를 설정하고, 이후에는 같은 비밀번호로 로그인합니다.
        </p>
        <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <ShieldCheck size={15} />
          게시글 작성 보호
        </div>
      </div>

      <form className="col-span-12 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30 md:col-span-7 md:p-6" onSubmit={onLogin}>
        <label className="grid gap-2 text-sm font-extrabold">
          아이디
          <input
            autoComplete="username"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            maxLength={24}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="seung"
            value={loginId}
          />
        </label>
        <label className="grid gap-2 text-sm font-extrabold">
          비밀번호
          <input
            autoComplete="current-password"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            maxLength={40}
            onChange={(event) => setLoginPasscode(event.target.value)}
            placeholder="비밀번호 입력"
            type="password"
            value={loginPasscode}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {loginMessage || (ownerConfigured ? "설정한 비밀번호로 로그인하세요." : "아이디 seung과 사용할 비밀번호 8자 이상을 입력하면 관리자 비밀번호가 설정됩니다.")}
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" type="submit">
            <LogIn size={17} />
            로그인
          </button>
        </div>
      </form>
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
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Write</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">글쓰기</h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
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
      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{post.category}</p>
      <h3 className="mt-3 text-lg font-black leading-tight md:text-xl">{post.title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{post.excerpt}</p>
      <button className="mt-5 inline-flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white" type="button" onClick={() => onOpenPost(post.id)}>
        <BookOpen size={17} />
        읽기
      </button>
    </article>
  );
}

function Stat({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`${className ?? ""} p-6`}>
      <strong className="block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{label}</span>
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
