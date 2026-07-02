import mysql from "mysql2/promise";
import { mysqlConfig } from "./config.ts";

export const pool = mysql.createPool({
  host: mysqlConfig.host,
  port: mysqlConfig.port,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export async function pingDatabase() {
  await pool.query("SELECT 1");
}
