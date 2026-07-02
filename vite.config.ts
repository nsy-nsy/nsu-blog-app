import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? (process.env.VITE_BASE_PATH ?? "/nsu-blog-app/") : "/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    strictPort: false,
    proxy: {
      "/api": "http://127.0.0.1:4175",
    },
  },
  preview: {
    host: "127.0.0.1",
  },
}));
