import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { starterPosts } from "../src/posts.ts";

const siteUrl = (process.env.VITE_SITE_URL ?? "https://nsy-nsy.github.io/nsu-blog-app").replace(/\/$/, "");
const sitePath = new URL(siteUrl).pathname.replace(/\/$/, "");
const basePath = (process.env.VITE_BASE_PATH ?? sitePath).replace(/\/$/, "");
const publicDir = resolve("public");

function absolute(path: string) {
  return `${siteUrl}${path}`;
}

function xmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const urls = [
  { loc: absolute("/"), lastmod: "2026-07-02", priority: "1.0" },
  { loc: absolute("/posts"), lastmod: "2026-07-02", priority: "0.9" },
  ...starterPosts.map((post) => ({
    loc: absolute(`/posts/${post.id}`),
    lastmod: post.createdAt.slice(0, 10),
    priority: "0.8",
  })),
];

mkdirSync(publicDir, { recursive: true });

writeFileSync(
  resolve(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) =>
        `  <url>\n    <loc>${xmlEscape(url.loc)}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>\n`,
  "utf8",
);

writeFileSync(
  resolve(publicDir, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: ${basePath}/login\nDisallow: ${basePath}/write\nSitemap: ${absolute("/sitemap.xml")}\n`,
  "utf8",
);

console.log(`SEO files generated for ${siteUrl}`);
