import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Clock3, Home, List, LogIn, LogOut, Menu, Moon, PenLine, Search, ShieldCheck, Sun, Tag, X } from "lucide-react";
import { clearAuth, fetchCurrentUser, hasStoredToken, login, type AuthUser } from "./auth";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Page, Post, PostDraft } from "./types";

type Theme = "light" | "dark";

const STORAGE_KEY = "nsu-blog-posts-v5";
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://nsy-nsy.github.io/nsu-blog-app").replace(/\/$/, "");
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const ASSET_BASE = import.meta.env.BASE_URL;
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

function routeToState(posts: Post[]) {
  const rawPath = window.location.pathname.replace(/\/$/, "") || "/";
  const path = BASE_PATH && rawPath.startsWith(BASE_PATH) ? rawPath.slice(BASE_PATH.length) || "/" : rawPath;
  const postMatch = path.match(/\/posts\/([^/]+)$/);

  if (postMatch) {
    const id = decodeURIComponent(postMatch[1]);
    return { page: "detail" as Page, selectedId: posts.some((post) => post.id === id) ? id : posts[0]?.id ?? "" };
  }

  if (path.endsWith("/posts")) return { page: "posts" as Page, selectedId: posts[0]?.id ?? "" };
  if (path.endsWith("/write")) return { page: "write" as Page, selectedId: posts[0]?.id ?? "" };
  if (path.endsWith("/login")) return { page: "login" as Page, selectedId: posts[0]?.id ?? "" };
  return { page: "home" as Page, selectedId: posts[0]?.id ?? "" };
}

function pagePath(page: Page, post?: Post) {
  if (page === "posts") return "/posts";
  if (page === "detail" && post) return `/posts/${encodeURIComponent(post.id)}`;
  if (page === "write") return "/write";
  if (page === "login") return "/login";
  return "/";
}

function updateBrowserUrl(path: string) {
  const nextPath = `${BASE_PATH}${path === "/" ? "" : path}` || "/";
  if (window.location.pathname === nextPath) return;
  window.history.pushState(null, "", nextPath);
}

function setMeta(selector: string, value: string) {
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute("content", value);
}

function setCanonical(url: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) return;
  element.href = url;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme());
  const [posts, setPosts] = useState<Post[]>(() => safeRead(STORAGE_KEY, starterPosts));
  const initialRoute = routeToState(posts);
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(initialRoute.selectedId);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(() => (typeof window === "undefined" ? false : hasStoredToken()));
  const [loginId, setLoginId] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginPending, setLoginPending] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const onPopState = () => {
      const next = routeToState(posts);
      setPage(next.page);
      setSelectedId(next.selectedId);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [posts]);

  useEffect(() => {
    if (!hasStoredToken()) {
      setAuthChecking(false);
      return;
    }

    fetchCurrentUser()
      .then((user) => {
        setAuthUser(user);
        setIsLoggedIn(Boolean(user));
      })
      .catch(() => {
        clearAuth();
        setAuthUser(null);
        setIsLoggedIn(false);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (authChecking) return;

    if (page === "login" && isLoggedIn) {
      setPage("write");
      return;
    }

    if (page === "write" && !isLoggedIn) {
      setLoginMessage("글쓰기는 로그인 후 사용할 수 있습니다.");
      setPage("login");
    }
  }, [authChecking, isLoggedIn, page]);

  const selectedPost = posts.find((post) => post.id === selectedId) ?? posts[0];

  useEffect(() => {
    const title = selectedPost && page === "detail" ? `${selectedPost.title} | 세웅이만의 블로그` : page === "posts" ? "글목록 | 세웅이만의 블로그" : "세웅이만의 블로그";
    const description =
      selectedPost && page === "detail"
        ? selectedPost.excerpt
        : page === "posts"
          ? "AI 글쓰기, 블로그 수익화, 애드센스, 데이터 분석, React 웹개발 글목록입니다."
          : "AI 글쓰기, 블로그 수익화, 애드센스, 데이터 분석, React 웹개발을 기록하는 실전 블로그입니다.";
    const path = pagePath(page, selectedPost);
    const url = `${SITE_URL}${path}`;
    const robots = page === "login" || page === "write" ? "noindex, nofollow" : "index, follow, max-image-preview:large";

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', robots);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setCanonical(url);
  }, [page, selectedPost]);

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
    if (nextPage === "login" && isLoggedIn) {
      setPage("write");
      updateBrowserUrl("/write");
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (nextPage === "write" && !isLoggedIn) {
      if (authChecking) {
        setPage("write");
        updateBrowserUrl("/write");
        setMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setLoginMessage("글쓰기는 로그인 후 사용할 수 있습니다.");
      setPage("login");
      updateBrowserUrl("/login");
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPage(nextPage);
    updateBrowserUrl(pagePath(nextPage, selectedPost));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPost(id: string) {
    const post = posts.find((item) => item.id === id);
    setSelectedId(id);
    setPage("detail");
    updateBrowserUrl(pagePath("detail", post));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (!normalizedId || normalizedPasscode.length < 8) {
      setLoginMessage("관리자 아이디와 8자 이상 비밀번호를 입력하세요.");
      return;
    }

    setLoginPending(true);
    try {
      const user = await login(normalizedId, normalizedPasscode);
      setAuthUser(user);
      setIsLoggedIn(true);
      setLoginId("");
      setLoginPasscode("");
      setLoginMessage("로그인되었습니다.");
      navigate("write");
    } catch (error) {
      const errorMessage = error instanceof Error && error.message !== "Failed to fetch" ? error.message : "백엔드 서버에 연결할 수 없습니다. npm run dev:api를 실행하세요.";
      setLoginMessage(errorMessage);
    } finally {
      setLoginPending(false);
    }
  }

  function handleLogout() {
    clearAuth();
    setAuthUser(null);
    setIsLoggedIn(false);
    setMessage("");
    if (page === "write") navigate("home");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950 transition-colors dark:bg-[#050505] dark:text-zinc-50">
      <Header
        menuOpen={menuOpen}
        authUser={authUser}
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
      {page === "login" && authChecking && <AuthStatusCard message="로그인 상태를 확인 중입니다." />}
      {page === "login" && !authChecking && !isLoggedIn && (
        <LoginPage
          loginId={loginId}
          loginMessage={loginMessage}
          loginPasscode={loginPasscode}
          loginPending={loginPending}
          onLogin={handleLogin}
          setLoginId={setLoginId}
          setLoginPasscode={setLoginPasscode}
        />
      )}
      {page === "write" && authChecking && <AuthStatusCard message="글쓰기 권한을 확인 중입니다." />}
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

      <Footer />
    </main>
  );
}

function Header({
  authUser,
  isLoggedIn,
  menuOpen,
  onNavigate,
  onLogout,
  onToggleMenu,
  onToggleTheme,
  page,
  theme,
}: {
  authUser: AuthUser | null;
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
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f7f7f5]/92 px-5 py-4 backdrop-blur-xl transition-colors dark:border-zinc-800 dark:bg-[#050505]/88 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <button className="flex min-w-0 items-center text-left" type="button" onClick={() => onNavigate("home")}>
          <span className="min-w-0">
            <span className="block truncate text-[22px] font-black leading-none text-zinc-950 dark:text-white md:text-2xl">NSU BLOG<span className="text-emerald-500">.</span></span>
          </span>
        </button>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="hidden items-center gap-5 rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-2 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-black/20 md:flex">
            <button
              aria-label={theme === "dark" ? "라이트모드로 변경" : "다크모드로 변경"}
              className="relative grid size-8 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-950 transition hover:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-500"
              type="button"
              onClick={onToggleTheme}
            >
              <Sun className={`absolute transition duration-300 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={17} />
              <Moon className={`absolute transition duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={17} />
            </button>

            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <nav className="flex items-center gap-5" aria-label="주요 메뉴">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.page || (page === "detail" && item.page === "posts") || (page === "login" && item.page === "login");
                return (
                  <button
                    key={item.page}
                    className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${
                      active
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
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

            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="max-w-24 truncate text-[12px] font-extrabold text-zinc-500 dark:text-zinc-400">{authUser?.username ?? "관리자"}</span>
                <button className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white" type="button" onClick={onLogout}>
                  <LogOut size={15} />
                  로그아웃
                </button>
              </div>
            ) : (
              <button className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${page === "login" ? "text-emerald-600 dark:text-emerald-300" : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"}`} type="button" onClick={() => onNavigate("login")}>
                <LogIn size={15} />
                로그인
              </button>
            )}
          </div>

          <button
            aria-label={theme === "dark" ? "라이트모드로 변경" : "다크모드로 변경"}
            className="relative grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-950 transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-400 md:hidden"
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
            <div className="grid gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
              <span className="px-4 py-1 text-xs font-extrabold text-zinc-500 dark:text-zinc-400">{authUser?.username ?? "관리자"} 로그인 중</span>
              <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black text-zinc-700 dark:text-zinc-300" type="button" onClick={onLogout}>
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
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
  loginPending,
  onLogin,
  setLoginId,
  setLoginPasscode,
}: {
  loginId: string;
  loginMessage: string;
  loginPasscode: string;
  loginPending: boolean;
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
          글쓰기는 백엔드와 MySQL 인증을 통과한 관리자만 사용할 수 있습니다. 처음 로그인할 때 입력한 비밀번호가 서버에 해시로 저장됩니다.
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
            disabled={loginPending}
            maxLength={24}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="관리자 아이디"
            value={loginId}
          />
        </label>
        <label className="grid gap-2 text-sm font-extrabold">
          비밀번호
          <input
            autoComplete="current-password"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={loginPending}
            maxLength={40}
            onChange={(event) => setLoginPasscode(event.target.value)}
            placeholder="비밀번호 입력"
            type="password"
            value={loginPasscode}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {loginMessage || "관리자 아이디와 사용할 비밀번호 8자 이상을 입력하세요."}
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" disabled={loginPending} type="submit">
            <LogIn size={17} />
            {loginPending ? "확인 중" : "로그인"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AuthStatusCard({ message }: { message: string }) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 px-5 py-10 md:px-8 md:py-16">
      <div className="col-span-12 rounded-xl border border-zinc-200 bg-white p-6 text-sm font-extrabold text-zinc-700 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-black/30">
        {message}
      </div>
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

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-10 text-zinc-950 transition-colors dark:border-zinc-800 dark:bg-black dark:text-white md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <div className="col-span-12">
          <div className="flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-sm text-white dark:bg-white dark:text-zinc-950">NSU</span>
            <span>세웅이만의 블로그</span>
          </div>
          <p className="mt-4 max-w-xl leading-7 text-zinc-600 dark:text-zinc-300">
            AI와 웹개발을 직접 실험하며 블로그 수익화까지 기록하는 개인 블로그입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
