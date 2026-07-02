import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAdminAuth, saveAdminAuth, type PasswordHash } from "./auth-store.ts";
import { apiConfig } from "./config.ts";
import { pingDatabase } from "./db.ts";

type TokenPayload = {
  sub: string;
  iat: number;
  exp: number;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const secretFile = join(dataDir, "session-secret.txt");
const { port, adminUser, tokenMaxAgeSeconds } = apiConfig;

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

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new Error("Payload too large");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function getBearerToken(request: IncomingMessage) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      try {
        await pingDatabase();
        sendJson(response, 200, { ok: true, database: "ok" });
      } catch {
        sendJson(response, 200, { ok: true, database: "unavailable" });
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      const payload = verifyToken(getBearerToken(request));
      sendJson(response, payload ? 200 : 401, { authenticated: Boolean(payload), user: payload?.sub ?? null });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      if (username !== adminUser || password.length < 8) {
        sendJson(response, 401, { message: "아이디 또는 비밀번호가 맞지 않습니다." });
        return;
      }

      const auth = await getAdminAuth(adminUser);
      if (!auth) {
        const passwordHash = hashPassword(password);
        await saveAdminAuth(adminUser, passwordHash);
      } else if (auth.username !== adminUser || !verifyPassword(password, auth.passwordHash)) {
        sendJson(response, 401, { message: "아이디 또는 비밀번호가 맞지 않습니다." });
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const token = signToken({ sub: adminUser, iat: now, exp: now + tokenMaxAgeSeconds });
      sendJson(response, 200, { token, user: adminUser, expiresIn: tokenMaxAgeSeconds });
      return;
    }

    sendJson(response, 404, { message: "Not found" });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: "Server error" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`API server running at http://127.0.0.1:${port}`);
});
