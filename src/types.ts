export type Category = "로드맵" | "웹개발" | "데이터분석" | "AI서비스" | "인프라" | "마케팅" | "보안";

export type Post = {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  createdAt: string;
  readMinutes: number;
  tags: string[];
};

export type PostDraft = Pick<Post, "title" | "category" | "excerpt" | "body" | "tags">;

export type WeekPlan = {
  week: string;
  title: string;
  timecode: string;
  summary: string;
  stack: string[];
};
