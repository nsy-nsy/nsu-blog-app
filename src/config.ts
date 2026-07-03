import type { Category, PostDraft } from "./types";

export const STORAGE_KEY = "nsu-blog-posts-v6";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://nsy-nsy.github.io/nsu-blog-app").replace(/\/$/, "");
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
export const ASSET_BASE = import.meta.env.BASE_URL;

export const categories: Category[] = ["일상기록", "생활정보", "컴퓨터", "윈도우", "블로그운영", "리뷰"];

export const emptyDraft: PostDraft = {
  title: "",
  category: "일상기록",
  excerpt: "",
  body: "",
  tags: [],
};
