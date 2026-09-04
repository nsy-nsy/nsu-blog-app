import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPostFromApi, deletePostFromApi, fetchHomeSettingsFromApi, fetchPostsFromApi, hasRemoteApi, saveHomeSettingsToApi, updatePostFromApi } from "./api";
import { clearAuth, fetchCurrentUser, hasStoredToken, login, type AuthUser } from "./auth";
import { AuthStatusCard } from "./components/AuthStatusCard";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { categories, defaultHomeSettings, emptyDraft, HOME_SETTINGS_STORAGE_KEY, STORAGE_KEY } from "./config";
import { AdminPage } from "./pages/AdminPage";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PostsPage } from "./pages/PostsPage";
import { WritePage } from "./pages/WritePage";
import { starterPosts } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, HomeFeature, HomeSectionId, HomeSettings, Page, Post, PostDraft, Theme } from "./types";
import { estimateReadMinutes, parseTags } from "./utils/blog";
import { pagePath, routeToState, updateBrowserUrl } from "./utils/routing";
import { updatePageSeo } from "./utils/seo";
import { getSystemTheme } from "./utils/theme";

const INVALID_LOGIN_MESSAGE = "아이디나 비밀번호가 올바르지 않습니다.";
const BODY_MAX_LENGTH = 30_000;
const HOME_SECTION_IDS: HomeSectionId[] = ["hero", "features", "latest"];

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

function mergeHomeSettings(value: HomeSettings): HomeSettings {
  const sectionOrder = value.sectionOrder?.filter((sectionId): sectionId is HomeSectionId => HOME_SECTION_IDS.includes(sectionId)) ?? [];
  const nextOrder = [...sectionOrder, ...HOME_SECTION_IDS.filter((sectionId) => !sectionOrder.includes(sectionId))];
  const featureMap = new Map<string, HomeFeature>((value.features ?? []).map((feature) => [feature.id, feature]));

  return {
    ...defaultHomeSettings,
    ...value,
    latestCount: Math.min(12, Math.max(1, Number(value.latestCount) || defaultHomeSettings.latestCount)),
    features: defaultHomeSettings.features.map((feature) => ({ ...feature, ...featureMap.get(feature.id) })),
    sectionOrder: nextOrder,
  };
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme());
  const [posts, setPosts] = useState<Post[]>(() => safeRead<Post[]>(STORAGE_KEY, starterPosts).map(normalizePostCategory));
  const [homeSettings, setHomeSettings] = useState<HomeSettings>(() => mergeHomeSettings(safeRead<HomeSettings>(HOME_SETTINGS_STORAGE_KEY, defaultHomeSettings)));
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
  const featuredPosts = posts;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!hasRemoteApi()) return;

    fetchPostsFromApi()
      .then((apiPosts) => {
        if (apiPosts.length > 0) {
          setPosts(apiPosts.map(normalizePostCategory));
        }
      })
      .catch(() => {
        setMessage("백엔드 글 목록을 불러오지 못해 브라우저 저장 글을 표시합니다.");
      });

    fetchHomeSettingsFromApi()
      .then((settings) => {
        if (settings) {
          const nextSettings = mergeHomeSettings(settings);
          setHomeSettings(nextSettings);
          safeWrite(HOME_SETTINGS_STORAGE_KEY, nextSettings);
        }
      })
      .catch(() => {
        setMessage("백엔드 메인 설정을 불러오지 못해 브라우저 저장 설정을 표시합니다.");
      });
  }, []);

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

    if ((page === "write" || page === "admin") && !isLoggedIn) {
      setLoginMessage(page === "admin" ? "관리 페이지는 로그인 후 사용할 수 있습니다." : "글쓰기는 로그인 후 사용할 수 있습니다.");
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

    if ((nextPage === "write" || nextPage === "admin") && !isLoggedIn) {
      if (authChecking) {
        moveToPage(nextPage, pagePath(nextPage, selectedPost));
        return;
      }

      setLoginMessage(nextPage === "admin" ? "관리 페이지는 로그인 후 사용할 수 있습니다." : "글쓰기는 로그인 후 사용할 수 있습니다.");
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

  function persistLocal(nextPosts: Post[]) {
    setPosts(nextPosts);
    safeWrite(STORAGE_KEY, nextPosts);
  }

  function handleHomeSettingsChange(nextSettings: HomeSettings) {
    setHomeSettings(mergeHomeSettings(nextSettings));
    setMessage("아직 저장되지 않은 변경사항이 있습니다.");
  }

  async function handleSaveHomeSettings() {
    const nextSettings = mergeHomeSettings(homeSettings);
    if (hasRemoteApi()) {
      try {
        const savedSettings = mergeHomeSettings(await saveHomeSettingsToApi(nextSettings));
        setHomeSettings(savedSettings);
        safeWrite(HOME_SETTINGS_STORAGE_KEY, savedSettings);
        setMessage("메인페이지 설정이 DB에 저장되었습니다.");
        return;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "메인페이지 설정 저장에 실패했습니다.");
        return;
      }
    }

    setHomeSettings(nextSettings);
    safeWrite(HOME_SETTINGS_STORAGE_KEY, nextSettings);
    setMessage("메인페이지 설정이 저장되었습니다.");
  }

  function handleResetHomeSettings() {
    setHomeSettings(defaultHomeSettings);
    safeWrite(HOME_SETTINGS_STORAGE_KEY, defaultHomeSettings);
    setMessage("메인페이지 설정을 기본값으로 되돌렸습니다.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      if (!existingPost) return;

      const updatedPost: Post = {
        ...existingPost,
        ...nextDraft,
        images: undefined,
        readMinutes: estimateReadMinutes(body),
        searchIntent: existingPost.searchIntent || "직접 작성한 개인 블로그 글",
      };

      let savedPost = updatedPost;
      if (hasRemoteApi()) {
        try {
          savedPost = await updatePostFromApi(editingPostId, updatedPost);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "글 수정에 실패했습니다.");
          return;
        }
      }

      const nextPosts = posts.map((post) => (post.id === editingPostId ? savedPost : post));
      persistLocal(nextPosts);
      setDraft(emptyDraft);
      setTagInput("");
      setEditingPostId(null);
      setSelectedId(savedPost.id);
      setMessage("글이 수정되었습니다.");
      moveToPage("detail", pagePath("detail", savedPost));
      return;
    }

    let post: Post = {
      ...nextDraft,
      id: makeId(),
      createdAt: new Date().toISOString(),
      readMinutes: estimateReadMinutes(body),
      searchIntent: "직접 작성한 개인 블로그 글",
    };

    if (hasRemoteApi()) {
      try {
        post = await createPostFromApi(post);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "글 저장에 실패했습니다.");
        return;
      }
    }

    persistLocal([post, ...posts].slice(0, 80));
    setDraft(emptyDraft);
    setTagInput("");
    setSelectedId(post.id);
    setMessage("글이 저장되었습니다.");
    navigate("detail");
  }

  async function handleDelete(id: string) {
    if (!isLoggedIn) return;

    if (hasRemoteApi()) {
      try {
        await deletePostFromApi(id);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "글 삭제에 실패했습니다.");
        return;
      }
    }

    const nextPosts = posts.filter((post) => post.id !== id);
    persistLocal(nextPosts);
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

      {page === "home" && <HomePage homeSettings={homeSettings} onNavigate={navigate} onOpenPost={openPost} posts={featuredPosts} />}
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
      {page === "notFound" && <NotFoundPage onNavigate={navigate} />}
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
      {page === "admin" && authChecking && <AuthStatusCard message="관리 권한을 확인 중입니다." />}
      {page === "admin" && isLoggedIn && (
        <AdminPage
          homeSettings={homeSettings}
          message={message}
          onHomeSettingsChange={handleHomeSettingsChange}
          onResetHomeSettings={handleResetHomeSettings}
          onSaveHomeSettings={handleSaveHomeSettings}
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
