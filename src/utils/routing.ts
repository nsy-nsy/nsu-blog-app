import { BASE_PATH } from "../config";
import type { Page, Post } from "../types";

export function routeToState(posts: Post[]) {
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

export function pagePath(page: Page, post?: Post) {
  if (page === "posts") return "/posts";
  if (page === "detail" && post) return `/posts/${encodeURIComponent(post.id)}`;
  if (page === "write") return "/write";
  if (page === "login") return "/login";
  return "/";
}

export function updateBrowserUrl(path: string) {
  const nextPath = `${BASE_PATH}${path === "/" ? "" : path}` || "/";
  if (window.location.pathname === nextPath) return;
  window.history.pushState(null, "", nextPath);
}
