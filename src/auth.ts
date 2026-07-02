const AUTH_TOKEN_KEY = "nsu-blog-token-v1";

export type AuthUser = {
  username: string;
};

export function getStoredToken() {
  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function hasStoredToken() {
  return Boolean(getStoredToken());
}

export function storeToken(token: string) {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuth() {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function fetchCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    clearAuth();
    return null;
  }

  const data = (await response.json()) as { authenticated?: boolean; user?: string | null };
  if (!data.authenticated || !data.user) {
    clearAuth();
    return null;
  }

  return { username: data.user } satisfies AuthUser;
}

export async function login(username: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = (await response.json()) as { token?: string; user?: string; message?: string };
  if (!response.ok || !data.token || !data.user) {
    throw new Error(data.message ?? "아이디 또는 비밀번호가 맞지 않습니다.");
  }

  storeToken(data.token);
  return { username: data.user } satisfies AuthUser;
}
