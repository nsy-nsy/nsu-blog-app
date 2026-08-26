import type { Category, PostDraft } from "./types";

export const STORAGE_KEY = "nsu-blog-posts-v10";
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://dysco.co.kr").replace(/\/$/, "");
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
export const ASSET_BASE = import.meta.env.BASE_URL;

export const categories: Category[] = ["리뷰", "여행", "일상", "컴퓨터"];

export const emptyDraft: PostDraft = {
  title: "",
  category: "리뷰",
  excerpt: "",
  body: "",
  tags: [],
  media: [],
};
