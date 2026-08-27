import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAdminAuth, saveAdminAuth, type PasswordHash } from "./auth-store.ts";
import { apiConfig } from "./config.ts";
import { pingDatabase } from "./db.ts";
import { createPost, deletePost, getPost, listPosts, updatePost, type BlogPost } from "./posts-store.ts";

type TokenPayload = {
  sub: string;
  iat: number;
  exp: number;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const secretFile = join(dataDir, "session-secret.txt");
const { host, port, adminUser, tokenMaxAgeSeconds } = apiConfig;
const invalidLoginMessage = "아이디나 비밀번호가 올바르지 않습니다.";
const bodyMaxBytes = 80 * 1024 * 1024;
const validCategories = new Set(["리뷰", "여행", "일상", "컴퓨터"]);
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

mkdirSync(dataDir, { recursive: true });

function getSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }

  try {
    return readFileSync(secretFile, "utf8").trim();
  } catch {
    const secret = randomBytes(48).toString("hex");
    writeFileSync(secretFile, secret, { mode: 0o600 });
    return secret;
  }
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, saved?: PasswordHash) {
  if (!saved?.salt || !saved?.hash) return false;
  const candidate = hashPassword(password, saved.salt).hash;
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(saved.hash, "hex"));
}

function base64Url(input: unknown) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function signToken(payload: TokenPayload) {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const body = base64Url(payload);
  const signature = createHmac("sha256", getSecret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const expected = createHmac("sha256", getSecret()).update(`${header}.${body}`).digest("base64url");
    const signatureBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expected);
    if (signatureBytes.length !== expectedBytes.length || !timingSafeEqual(signatureBytes, expectedBytes)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.sub !== adminUser) return null;
    return payload;
  } catch {
    return null;
  }
}

function getCorsOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return apiConfig.corsOrigin;
  return origin === apiConfig.corsOrigin ? origin : "";
}

function sendJson(request: IncomingMessage, response: ServerResponse, status: number, body: unknown) {
  const corsOrigin = getCorsOrigin(request);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Vary": "Origin",
    ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin } : {}),
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > bodyMaxBytes) throw new ApiError(413, "Payload too large");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Invalid JSON");
  }
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function readMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function parseStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseMedia(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const media = item as Record<string, unknown>;
      const type = media.type === "video" ? "video" : "image";
      const src = cleanText(media.src, 20_000_000);
      const name = cleanText(media.name, 160);
      const id = cleanText(media.id, 160);
      const validSrc = src.startsWith("data:image/") || src.startsWith("data:video/") || src.startsWith("posts/") || src.startsWith("https://");
      return id && validSrc ? { id, type, src, name: name || id } : null;
    })
    .filter((item): item is NonNullable<ReturnType<typeof parseMedia>[number]> => Boolean(item))
    .slice(0, 12);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || `post-${Date.now().toString(36)}`;
}

function parsePost(body: Record<string, unknown>, existing?: BlogPost): BlogPost {
  const title = cleanText(body.title, 90);
  const category = cleanText(body.category, 24);
  const excerpt = cleanText(body.excerpt, 220);
  const content = cleanText(body.body, 30_000);
  const tags = parseStringArray(body.tags, 12, 32);
  const media = parseMedia(body.media);
  const images = parseStringArray(body.images, 40, 1000);

  if (!title || !excerpt || content.length < 120 || !validCategories.has(category)) {
    throw new ApiError(400, "제목, 요약, 본문 120자 이상, 올바른 카테고리를 입력해주세요.");
  }

  return {
    id: existing?.id ?? slugify(cleanText(body.id, 160) || title),
    title,
    category: category as BlogPost["category"],
    excerpt,
    body: content,
    images: images.length > 0 ? images : undefined,
    media: media.length > 0 ? media : undefined,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    readMinutes: readMinutes(content),
    tags,
    searchIntent: cleanText(body.searchIntent, 240) || existing?.searchIntent || "직접 작성한 개인 블로그 글",
  };
}

function requireAdmin(request: IncomingMessage) {
  return verifyToken(getBearerToken(request));
}

function getClientKey(request: IncomingMessage) {
  return String(request.headers["x-forwarded-for"] ?? request.socket.remoteAddress ?? "unknown").split(",")[0].trim();
}

function checkLoginRateLimit(request: IncomingMessage) {
  const key = getClientKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  current.count += 1;
  return current.count <= 10;
}

function clearLoginRateLimit(request: IncomingMessage) {
  loginAttempts.delete(getClientKey(request));
}

function getBearerToken(request: IncomingMessage) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendJson(request, response, 204, {});
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      try {
        await pingDatabase();
        sendJson(request, response, 200, { ok: true, database: "ok" });
      } catch {
        sendJson(request, response, 200, { ok: true, database: "unavailable" });
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      const payload = verifyToken(getBearerToken(request));
      sendJson(request, response, payload ? 200 : 401, { authenticated: Boolean(payload), user: payload?.sub ?? null });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      if (!checkLoginRateLimit(request)) {
        sendJson(request, response, 429, { message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." });
        return;
      }

      const body = await readBody(request);
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      if (username !== adminUser || password.length < 8) {
        sendJson(request, response, 401, { message: invalidLoginMessage });
        return;
      }

      const auth = await getAdminAuth(adminUser);
      if (!auth) {
        const passwordHash = hashPassword(password);
        await saveAdminAuth(adminUser, passwordHash);
      } else if (auth.username !== adminUser || !verifyPassword(password, auth.passwordHash)) {
        sendJson(request, response, 401, { message: invalidLoginMessage });
        return;
      }

      clearLoginRateLimit(request);
      const now = Math.floor(Date.now() / 1000);
      const token = signToken({ sub: adminUser, iat: now, exp: now + tokenMaxAgeSeconds });
      sendJson(request, response, 200, { token, user: adminUser, expiresIn: tokenMaxAgeSeconds });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/posts") {
      sendJson(request, response, 200, { posts: await listPosts() });
      return;
    }

    const postMatch = url.pathname.match(/^\/api\/posts\/([^/]+)$/);

    if (request.method === "GET" && postMatch) {
      const post = await getPost(decodeURIComponent(postMatch[1]));
      sendJson(request, response, post ? 200 : 404, post ? { post } : { message: "Post not found" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/posts") {
      if (!requireAdmin(request)) {
        sendJson(request, response, 401, { message: "Unauthorized" });
        return;
      }

      const body = await readBody(request);
      const post = parsePost(body);
      if (await getPost(post.id)) {
        post.id = `${post.id}-${randomBytes(3).toString("hex")}`;
      }
      await createPost(post);
      sendJson(request, response, 201, { post });
      return;
    }

    if (request.method === "PUT" && postMatch) {
      if (!requireAdmin(request)) {
        sendJson(request, response, 401, { message: "Unauthorized" });
        return;
      }

      const id = decodeURIComponent(postMatch[1]);
      const existing = await getPost(id);
      if (!existing) {
        sendJson(request, response, 404, { message: "Post not found" });
        return;
      }

      const post = parsePost(await readBody(request), existing);
      const updated = await updatePost(id, post);
      sendJson(request, response, updated ? 200 : 404, updated ? { post } : { message: "Post not found" });
      return;
    }

    if (request.method === "DELETE" && postMatch) {
      if (!requireAdmin(request)) {
        sendJson(request, response, 401, { message: "Unauthorized" });
        return;
      }

      const deleted = await deletePost(decodeURIComponent(postMatch[1]));
      sendJson(request, response, deleted ? 200 : 404, deleted ? { ok: true } : { message: "Post not found" });
      return;
    }

    sendJson(request, response, 404, { message: "Not found" });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      sendJson(request, response, error.status, { message: error.message });
      return;
    }

    sendJson(request, response, 500, { message: "Server error" });
  }
});

server.listen(port, host, () => {
  console.log(`API server running at http://${host}:${port}`);
});
