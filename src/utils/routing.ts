import { BASE_PATH } from "../config";
import type { Page, Post } from "../types";

const staticPages = new Set(["/", "/posts", "/write", "/admin", "/login"]);

export function routeToState(posts: Post[]) {
  const rawPath = window.location.pathname.replace(/\/$/, "") || "/";
  const path = BASE_PATH && rawPath.startsWith(BASE_PATH) ? rawPath.slice(BASE_PATH.length) || "/" : rawPath;
  const postMatch = path.match(/\/posts\/([^/]+)$/);
  const firstPostId = posts[0]?.id ?? "";

  if (postMatch) {
    const id = decodeURIComponent(postMatch[1]);
    return posts.some((post) => post.id === id) ? { page: "detail" as Page, selectedId: id } : { page: "notFound" as Page, selectedId: firstPostId };
  }

  if (path === "/posts") return { page: "posts" as Page, selectedId: firstPostId };
  if (path === "/write") return { page: "write" as Page, selectedId: firstPostId };
  if (path === "/admin") return { page: "admin" as Page, selectedId: firstPostId };
  if (path === "/login") return { page: "login" as Page, selectedId: firstPostId };
  if (staticPages.has(path)) return { page: "home" as Page, selectedId: firstPostId };
  return { page: "notFound" as Page, selectedId: firstPostId };
}

export function pagePath(page: Page, post?: Post) {
  if (page === "posts") return "/posts";
  if (page === "detail" && post) return `/posts/${encodeURIComponent(post.id)}`;
  if (page === "write") return "/write";
  if (page === "admin") return "/admin";
  if (page === "login") return "/login";
  if (page === "notFound") return window.location.pathname;
  return "/";
}

export function updateBrowserUrl(path: string) {
  const nextPath = `${BASE_PATH}${path === "/" ? "" : path}` || "/";
  if (window.location.pathname === nextPath) return;
  window.history.pushState(null, "", nextPath);
}
