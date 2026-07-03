import type { Category, PostDraft } from "./types";

export const STORAGE_KEY = "nsu-blog-posts-v5";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://nsy-nsy.github.io/nsu-blog-app").replace(/\/$/, "");
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
export const ASSET_BASE = import.meta.env.BASE_URL;

export const categories: Category[] = ["블로그수익화", "AI글쓰기", "애드센스", "데이터분석", "웹개발", "인프라"];

export const emptyDraft: PostDraft = {
  title: "",
  category: "블로그수익화",
  excerpt: "",
  body: "",
  tags: [],
};
