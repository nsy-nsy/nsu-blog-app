import { pool } from "./db.ts";

export type PasswordHash = {
  salt: string;
  hash: string;
};

export type AdminAuth = {
  username: string;
  passwordHash: PasswordHash;
};

export async function getAdminAuth(username: string) {
  const [rows] = await pool.execute(
    "SELECT username, password_salt, password_hash FROM admin_auth WHERE username = ? LIMIT 1",
    [username],
  );
  const [row] = rows as Array<{ username: string; password_salt: string; password_hash: string }>;

  if (!row) return null;
  return {
    username: row.username,
    passwordHash: {
      salt: row.password_salt,
      hash: row.password_hash,
    },
  } satisfies AdminAuth;
}

export async function saveAdminAuth(username: string, passwordHash: PasswordHash) {
  await pool.execute(
    `INSERT INTO admin_auth (username, password_salt, password_hash)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password_salt = VALUES(password_salt),
       password_hash = VALUES(password_hash)`,
    [username, passwordHash.salt, passwordHash.hash],
  );
}
