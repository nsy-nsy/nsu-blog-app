export type Category = "블로그수익화" | "AI글쓰기" | "애드센스" | "데이터분석" | "웹개발" | "인프라";
export type Theme = "light" | "dark";

export type Post = {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  createdAt: string;
  readMinutes: number;
  tags: string[];
  searchIntent: string;
};

export type PostDraft = Pick<Post, "title" | "category" | "excerpt" | "body" | "tags">;

export type Page = "home" | "posts" | "detail" | "write" | "login";
