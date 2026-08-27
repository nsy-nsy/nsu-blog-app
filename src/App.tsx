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
import { pagePath, routeToState, updateBrowserUrl } from "./utils/routing";
import { updatePageSeo } from "./utils/seo";
import { getSystemTheme } from "./utils/theme";

const INVALID_LOGIN_MESSAGE = "아이디나 비밀번호가 올바르지 않습니다.";
const BODY_MAX_LENGTH = 30_000;

function normalizePostCategory(post: Post): Post {
  const category = post.category as string;

  if (category === "생활정보" || category === "윈도우" || category === "블로그운영") {
    return { ...post, category: "컴퓨터" };
  }

  if (category === "일상기록") {
    return { ...post, category: "일상" };
  }

  return post;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme());
  const [posts, setPosts] = useState<Post[]>(() => safeRead<Post[]>(STORAGE_KEY, starterPosts).map(normalizePostCategory));
  const initialRoute = routeToState(posts);
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(initialRoute.selectedId);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
  const featuredPosts = posts.slice(0, 5);

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

    if (nextPage === "write" && isLoggedIn) {
      setDraft(emptyDraft);
      setTagInput("");
      setEditingPostId(null);
      setMessage("");
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

    const body = cleanText(draft.body, BODY_MAX_LENGTH);
    const nextDraft: PostDraft = {
      title: cleanText(draft.title, 90),
      category: draft.category,
      excerpt: cleanText(draft.excerpt, 220),
      body,
      media: draft.media ?? [],
      tags: parseTags(tagInput),
    };

    if (!nextDraft.title || !nextDraft.excerpt || nextDraft.body.length < 120) {
      setMessage("제목, 요약, 본문 120자 이상을 채워주세요.");
      return;
    }

    if (editingPostId) {
      const existingPost = posts.find((post) => post.id === editingPostId);
      const nextPosts = posts.map((post) =>
        post.id === editingPostId
          ? {
              ...post,
              ...nextDraft,
              images: undefined,
              readMinutes: estimateReadMinutes(body),
              searchIntent: post.searchIntent || "직접 작성한 개인 블로그 글",
            }
          : post,
      );

      persist(nextPosts);
      setDraft(emptyDraft);
      setTagInput("");
      setEditingPostId(null);
      setSelectedId(existingPost?.id ?? editingPostId);
      setMessage("글이 수정되었습니다.");
      moveToPage("detail", pagePath("detail", existingPost));
      return;
    }

    const post: Post = {
      ...nextDraft,
      id: makeId(),
      createdAt: new Date().toISOString(),
      readMinutes: estimateReadMinutes(body),
      searchIntent: "직접 작성한 개인 블로그 글",
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

  function handleEdit(id: string) {
    if (!isLoggedIn) return;

    const post = posts.find((item) => item.id === id);
    if (!post) return;

    setEditingPostId(id);
    setDraft({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      body: post.body,
      tags: post.tags,
      media:
        post.media ??
        post.images?.map((image, index) => ({
          id: `image-${index}`,
          name: `${post.title} 사진 ${index + 1}`,
          src: image,
          type: "image" as const,
        })) ??
        [],
    });
    setTagInput(post.tags.join(", "));
    setMessage("글을 수정한 뒤 저장하세요.");
    moveToPage("write", "/write");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedId = cleanText(loginId, 24).toLowerCase();
    const normalizedPasscode = cleanText(loginPasscode, 40);

    if (!normalizedId || normalizedPasscode.length < 8) {
      setLoginMessage(INVALID_LOGIN_MESSAGE);
      return;
    }

    setLoginPending(true);
    try {
      const user = await login(normalizedId, normalizedPasscode);
      setAuthUser(user);
      setIsLoggedIn(true);
      setLoginId("");
      setLoginPasscode("");
      setLoginMessage("");
      navigate("home");
    } catch {
      clearAuth();
      setAuthUser(null);
      setIsLoggedIn(false);
      setLoginMessage(INVALID_LOGIN_MESSAGE);
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
      {page === "detail" && <DetailPage isLoggedIn={isLoggedIn} onBack={() => navigate("posts")} onDelete={handleDelete} onEdit={handleEdit} post={selectedPost} />}
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
          submitLabel={editingPostId ? "수정 저장" : "글 저장"}
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
