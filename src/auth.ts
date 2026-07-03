const AUTH_TOKEN_KEY = "nsu-blog-token-v1";
const INVALID_LOGIN_MESSAGE = "아이디나 비밀번호가 잘못되었습니다.";

export type AuthUser = {
  username: string;
};

type AuthResponse = {
  authenticated?: boolean;
  expiresIn?: number;
  message?: string;
  token?: string;
  user?: string | null;
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

async function readAuthJson(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  try {
    return (await response.json()) as AuthResponse;
  } catch {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }
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

  const data = await readAuthJson(response);
  if (!data.authenticated || !data.user) {
    clearAuth();
    return null;
  }

  return { username: data.user } satisfies AuthUser;
}

export async function login(username: string, password: string) {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  const data = await readAuthJson(response);
  if (!response.ok || !data.token || !data.user) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  storeToken(data.token);
  return { username: data.user } satisfies AuthUser;
}
