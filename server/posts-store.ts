import type { ResultSetHeader } from "mysql2";
import { pool } from "./db.ts";

export type BlogPost = {
  id: string;
  title: string;
  category: "리뷰" | "여행" | "일상" | "컴퓨터";
  excerpt: string;
  body: string;
  images?: string[];
  media?: Array<{
    id: string;
    type: "image" | "video";
    src: string;
    name: string;
  }>;
  createdAt: string;
  readMinutes: number;
  tags: string[];
  searchIntent: string;
};

type PostRow = {
  id: string;
  title: string;
  category: BlogPost["category"];
  excerpt: string;
  body: string;
  images_json: string | null;
  media_json: string | null;
  created_at: Date | string;
  read_minutes: number;
  tags_json: string;
  search_intent: string;
};

function parseJsonArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToPost(row: PostRow): BlogPost {
  const images = parseJsonArray<string>(row.images_json, []);
  const media = parseJsonArray<NonNullable<BlogPost["media"]>[number]>(row.media_json, []);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    body: row.body,
    images: images.length > 0 ? images : undefined,
    media: media.length > 0 ? media : undefined,
    createdAt: toIsoString(row.created_at),
    readMinutes: row.read_minutes,
    tags: parseJsonArray<string>(row.tags_json, []),
    searchIntent: row.search_intent,
  };
}

export async function listPosts() {
  const [rows] = await pool.execute(
    `SELECT id, title, category, excerpt, body, images_json, media_json, created_at, read_minutes, tags_json, search_intent
     FROM posts
     ORDER BY created_at DESC`,
  );

  return (rows as PostRow[]).map(rowToPost);
}

export async function getPost(id: string) {
  const [rows] = await pool.execute(
    `SELECT id, title, category, excerpt, body, images_json, media_json, created_at, read_minutes, tags_json, search_intent
     FROM posts
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  const [row] = rows as PostRow[];
  return row ? rowToPost(row) : null;
}

export async function createPost(post: BlogPost) {
  await pool.execute(
    `INSERT INTO posts
       (id, title, category, excerpt, body, images_json, media_json, created_at, read_minutes, tags_json, search_intent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.title,
      post.category,
      post.excerpt,
      post.body,
      JSON.stringify(post.images ?? []),
      JSON.stringify(post.media ?? []),
      new Date(post.createdAt),
      post.readMinutes,
      JSON.stringify(post.tags),
      post.searchIntent,
    ],
  );
}

export async function updatePost(id: string, post: BlogPost) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE posts
     SET title = ?,
         category = ?,
         excerpt = ?,
         body = ?,
         images_json = ?,
         media_json = ?,
         read_minutes = ?,
         tags_json = ?,
         search_intent = ?
     WHERE id = ?`,
    [
      post.title,
      post.category,
      post.excerpt,
      post.body,
      JSON.stringify(post.images ?? []),
      JSON.stringify(post.media ?? []),
      post.readMinutes,
      JSON.stringify(post.tags),
      post.searchIntent,
      id,
    ],
  );

  return result.affectedRows > 0;
}

export async function deletePost(id: string) {
  const [result] = await pool.execute<ResultSetHeader>("DELETE FROM posts WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
