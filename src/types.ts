export type Category = "블로그 운영" | "콘텐츠 작성" | "수익화" | "보안";

export type Post = {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  createdAt: string;
};

export type PostDraft = Omit<Post, "id" | "createdAt">;
