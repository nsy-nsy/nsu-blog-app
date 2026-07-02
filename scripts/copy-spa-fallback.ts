import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const indexFile = resolve("dist", "index.html");
const fallbackFile = resolve("dist", "404.html");

if (existsSync(indexFile)) {
  copyFileSync(indexFile, fallbackFile);
  console.log("SPA fallback generated: dist/404.html");
}
