import { config } from "dotenv";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(serverDir, "..");

config({ path: join(projectRoot, ".env"), quiet: true });
config({ path: join(serverDir, ".env"), quiet: true });
