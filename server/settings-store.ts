import { pool } from "./db.ts";

export async function getSetting<T>(key: string, fallback: T) {
  const [rows] = await pool.execute("SELECT value_json FROM site_settings WHERE setting_key = ? LIMIT 1", [key]);
  const [row] = rows as Array<{ value_json: string }>;
  if (!row) return fallback;

  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return fallback;
  }
}

export async function saveSetting(key: string, value: unknown) {
  await pool.execute(
    `INSERT INTO site_settings (setting_key, value_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)`,
    [key, JSON.stringify(value)],
  );
}
