import { SITE_URL } from "../config";
import type { Page, Post } from "../types";
import { pagePath } from "./routing";

function setMeta(selector: string, value: string) {
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute("content", value);
}

function setCanonical(url: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) return;
  element.href = url;
}

export function updatePageSeo(page: Page, selectedPost?: Post) {
  const title =
    selectedPost && page === "detail"
      ? `${selectedPost.title} | 세웅이만의 블로그`
      : page === "posts"
        ? "글목록 | 세웅이만의 블로그"
        : "세웅이만의 블로그";
  const description =
    selectedPost && page === "detail"
      ? selectedPost.excerpt
      : page === "posts"
        ? "신발 리뷰, 일상 기록, 생활 정보, 컴퓨터 팁을 모아둔 글목록입니다."
        : "루이의 신발 리뷰와 일상 기록, 생활 정보, 컴퓨터 팁을 차분하게 남기는 개인 블로그입니다.";
  const path = pagePath(page, selectedPost);
  const url = `${SITE_URL}${path}`;
  const robots = page === "login" || page === "write" ? "noindex, nofollow" : "index, follow, max-image-preview:large";

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[name="robots"]', robots);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setCanonical(url);
}
