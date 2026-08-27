const AUTH_TOKEN_KEY = "nsu-blog-token-v1";
const LOCAL_AUTH_HASH_KEY = "nsu-blog-local-auth-hash-v1";
const LOCAL_AUTH_USER_KEY = "nsu-blog-local-auth-user-v1";
const DEFAULT_ADMIN_USER = "seung";
const INVALID_LOGIN_MESSAGE = "아이디나 비밀번호가 올바르지 않습니다.";

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

type LocalPasswordHash = {
  hash: string;
  salt: string;
};

function isStaticHosting() {
  return window.location.hostname === "dysco.co.kr" || window.location.hostname.endsWith(".github.io");
}

function getLocalAdminUser() {
  return (import.meta.env.VITE_ADMIN_USER ?? DEFAULT_ADMIN_USER).trim().toLowerCase();
}

function makeLocalToken(username: string) {
  return `local:${username}:${Date.now()}`;
}

function getStoredLocalPasswordHash() {
  const raw = window.localStorage.getItem(LOCAL_AUTH_HASH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalPasswordHash;
    return parsed.salt && parsed.hash ? parsed : null;
  } catch {
    return null;
  }
}

async function hashLocalPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations: 210_000,
      name: "PBKDF2",
      salt,
    },
    keyMaterial,
    256,
  );

  return {
    hash: Array.from(new Uint8Array(hashBuffer), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    salt: Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join(""),
  } satisfies LocalPasswordHash;
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function localLogin(username: string, password: string) {
  const adminUser = getLocalAdminUser();
  if (username !== adminUser || password.length < 8) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  const saved = getStoredLocalPasswordHash();
  if (!saved) {
    const passwordHash = await hashLocalPassword(password);
    window.localStorage.setItem(LOCAL_AUTH_HASH_KEY, JSON.stringify(passwordHash));
    window.localStorage.setItem(LOCAL_AUTH_USER_KEY, adminUser);
  } else {
    const candidate = await hashLocalPassword(password, hexToBytes(saved.salt));
    if (candidate.hash !== saved.hash) {
      throw new Error(INVALID_LOGIN_MESSAGE);
    }
  }

  const token = makeLocalToken(adminUser);
  storeToken(token);
  return { username: adminUser } satisfies AuthUser;
}

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

  if (isStaticHosting()) {
    const username = window.localStorage.getItem(LOCAL_AUTH_USER_KEY) ?? getLocalAdminUser();
    return token.startsWith("local:") ? ({ username } satisfies AuthUser) : null;
  }

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
  if (isStaticHosting()) {
    return localLogin(username, password);
  }

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
