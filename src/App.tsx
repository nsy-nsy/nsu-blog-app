import { FormEvent, useEffect, useMemo, useState } from "react";
import { clearAuth, fetchCurrentUser, hasStoredToken, login, type AuthUser } from "./auth";
import { AuthStatusCard } from "./components/AuthStatusCard";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { categories, emptyDraft, STORAGE_KEY } from "./config";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PostsPage } from "./pages/PostsPage";
import { WritePage } from "./pages/WritePage";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Page, Post, PostDraft, Theme } from "./types";
import { estimateReadMinutes, parseTags } from "./utils/blog";
import { getSystemTheme } from "./utils/theme";
import { pagePath, routeToState, updateBrowserUrl } from "./utils/routing";
import { updatePageSeo } from "./utils/seo";

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

  const selectedPost = posts.find((post) => post.id === selectedId) ?? posts[0];
  const filteredPosts = useMemo(() => filterPosts(posts, activeCategory, query), [activeCategory, posts, query]);
  const featuredPosts = posts.slice(0, 3);

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

  useEffect(() => {
    updatePageSeo(page, selectedPost);
  }, [page, selectedPost]);

  function navigate(nextPage: Page) {
    if (nextPage === "login" && isLoggedIn) {
      moveToPage("write", "/write");
      return;
    }

    if (nextPage === "write" && !isLoggedIn) {
      if (authChecking) {
        moveToPage("write", "/write");
        return;
      }

      setLoginMessage("글쓰기는 로그인 후 사용할 수 있습니다.");
      moveToPage("login", "/login");
      return;
    }

    moveToPage(nextPage, pagePath(nextPage, selectedPost));
  }

  function openPost(id: string) {
    const post = posts.find((item) => item.id === id);
    setSelectedId(id);
    moveToPage("detail", pagePath("detail", post));
  }

  function moveToPage(nextPage: Page, path: string) {
    setPage(nextPage);
    updateBrowserUrl(path);
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
        authUser={authUser}
        isLoggedIn={isLoggedIn}
        menuOpen={menuOpen}
        onLogout={handleLogout}
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

function filterPosts(posts: Post[], activeCategory: Category | "전체", query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesCategory = activeCategory === "전체" || post.category === activeCategory;
    const text = `${post.title} ${post.excerpt} ${post.tags.join(" ")}`.toLowerCase();
    return matchesCategory && (!normalizedQuery || text.includes(normalizedQuery));
  });
}
