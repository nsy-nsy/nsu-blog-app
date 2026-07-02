import mysql from "mysql2/promise";
import { mysqlConfig } from "./config.ts";

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

  console.log(`MySQL database ready: ${mysqlConfig.database}`);
} catch (error) {
  console.error("MySQL setup failed. Check that MySQL is running and the MYSQL_* values in .env are correct.");
  throw error;
} finally {
  await connection?.end();
}
