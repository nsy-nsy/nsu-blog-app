import mysql from "mysql2/promise";
import { mysqlConfig } from "./config.ts";
import { starterPosts } from "../src/posts.ts";

function escapeIdentifier(value: string) {
  return `\`${value.replaceAll("`", "``")}\``;
}

const database = escapeIdentifier(mysqlConfig.database);

let connection: Awaited<ReturnType<typeof mysql.createConnection>> | null = null;

try {
  connection = await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    multipleStatements: false,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE ${database}`);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_auth (
      username VARCHAR(64) NOT NULL PRIMARY KEY,
      password_salt VARCHAR(64) NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(160) NOT NULL PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      category VARCHAR(24) NOT NULL,
      excerpt VARCHAR(260) NOT NULL,
      body MEDIUMTEXT NOT NULL,
      images_json JSON NULL,
      media_json JSON NULL,
      created_at DATETIME NOT NULL,
      read_minutes INT NOT NULL DEFAULT 1,
      tags_json JSON NOT NULL,
      search_intent VARCHAR(260) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_posts_created_at (created_at),
      INDEX idx_posts_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [rows] = await connection.query("SELECT COUNT(*) AS count FROM posts");
  const [{ count }] = rows as Array<{ count: number }>;

  if (count === 0) {
    for (const post of starterPosts) {
      await connection.execute(
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
  }

  console.log(`MySQL database ready: ${mysqlConfig.database}`);
} catch (error) {
  console.error("MySQL setup failed. Check that MySQL is running and the MYSQL_* values in .env are correct.");
  throw error;
} finally {
  await connection?.end();
}
