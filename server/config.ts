import "./env.ts";

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function readRequired(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export const apiConfig = {
  port: readNumber("API_PORT", 4175),
  adminUser: readRequired("ADMIN_USER", "seung").toLowerCase(),
  tokenMaxAgeSeconds: readNumber("TOKEN_MAX_AGE_SECONDS", 60 * 60 * 8),
};

export const mysqlConfig = {
  host: readRequired("MYSQL_HOST", "127.0.0.1"),
  port: readNumber("MYSQL_PORT", 3306),
  user: readRequired("MYSQL_USER", "root"),
  password: process.env.MYSQL_PASSWORD ?? "",
  database: readRequired("MYSQL_DATABASE", "nsu_blog_app"),
};
