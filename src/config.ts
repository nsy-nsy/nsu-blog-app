import type { Category, HomeSettings, PostDraft } from "./types";

export const STORAGE_KEY = "nsu-blog-posts-v10";
export const HOME_SETTINGS_STORAGE_KEY = "nsu-blog-home-settings-v1";
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

export const defaultHomeSettings: HomeSettings = {
  eyebrow: "Review · Tech · Archive",
  title: "세웅이만의 블로그",
  description: "직접 써본 제품 리뷰와 컴퓨터, 서버, 리눅스, 파이썬 같은 기술 기록을 차분하게 모아두는 개인 아카이브입니다.",
  primaryButtonLabel: "글목록 보기",
  secondaryButtonLabel: "글쓰기",
  heroImage: `${ASSET_BASE}blog-hero.png`,
  heroImageAlt: "블로그 작업 공간",
  features: [
    {
      id: "reviews",
      title: "리뷰 노트",
      body: "직접 찍은 사진과 실제 사용감을 중심으로 기록합니다.",
      visible: true,
    },
    {
      id: "tech",
      title: "컴퓨터 기록",
      body: "서버, 리눅스, 파이썬처럼 다시 찾아볼 내용을 정리합니다.",
      visible: true,
    },
    {
      id: "search",
      title: "검색해도 도움 되는 글",
      body: "초보자가 따라 하기 쉬운 순서로 필요한 정보를 남깁니다.",
      visible: true,
    },
  ],
  latestEyebrow: "Latest",
  latestTitle: "최신글",
  latestCount: 5,
  sectionOrder: ["hero", "features", "latest"],
};
