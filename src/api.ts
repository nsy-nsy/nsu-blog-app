import { getStoredToken } from "./auth";
import type { Post } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function hasRemoteApi() {
  return Boolean(API_BASE_URL) || !["dysco.co.kr", "nsy-nsy.github.io"].includes(window.location.hostname);
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("API 응답이 올바르지 않습니다.");
  }

  const data = (await response.json()) as T;
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String(data.message) : "API 요청에 실패했습니다.";
    throw new Error(message);
  }

  return data;
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchPostsFromApi() {
  const data = await readJson<{ posts: Post[] }>(await fetch(apiUrl("/api/posts"), { headers: { Accept: "application/json" } }));
  return data.posts;
}

export async function createPostFromApi(post: Post) {
  const data = await readJson<{ post: Post }>(
    await fetch(apiUrl("/api/posts"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
      body: JSON.stringify(post),
    }),
  );
  return data.post;
}

export async function updatePostFromApi(id: string, post: Post) {
  const data = await readJson<{ post: Post }>(
    await fetch(apiUrl(`/api/posts/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
      body: JSON.stringify(post),
    }),
  );
  return data.post;
}

export async function deletePostFromApi(id: string) {
  await readJson<{ ok: true }>(
    await fetch(apiUrl(`/api/posts/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: { Accept: "application/json", ...authHeaders() },
    }),
  );
}
