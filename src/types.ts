export type Category = "일상기록" | "생활정보" | "컴퓨터" | "윈도우" | "블로그운영" | "리뷰";
export type Theme = "light" | "dark";

export type Post = {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  images?: string[];
  createdAt: string;
  readMinutes: number;
  tags: string[];
  searchIntent: string;
};

export type PostDraft = Pick<Post, "title" | "category" | "excerpt" | "body" | "tags">;

export type Page = "home" | "posts" | "detail" | "write" | "login";
