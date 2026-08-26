export type Category = "리뷰" | "여행" | "일상" | "컴퓨터";
export type Theme = "light" | "dark";

export type Post = {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  images?: string[];
  media?: PostMedia[];
  createdAt: string;
  readMinutes: number;
  tags: string[];
  searchIntent: string;
};

export type PostMedia = {
  id: string;
  type: "image" | "video";
  src: string;
  name: string;
};

export type PostDraft = Pick<Post, "title" | "category" | "excerpt" | "body" | "tags" | "media">;

export type Page = "home" | "posts" | "detail" | "write" | "login";
