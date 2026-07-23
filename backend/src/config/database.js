import mysql from "mysql2/promise";
import { config } from "./env.js";
import { logger } from "../utils/logger.js";

let pool = null;

try {
  const dbOptions = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (config.db.ssl) {
    dbOptions.ssl = {
      rejectUnauthorized: config.db.sslRejectUnauthorized,
    };
  }

  pool = mysql.createPool(dbOptions);

  // Startup table verification
  pool.getConnection()
    .then(async (conn) => {
      logger.info("✅ Connected to MySQL database pool");
      try {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS chats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            prompt TEXT NOT NULL,
            reply TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        logger.info("✅ Verified MySQL 'chats' table schema");
      } catch (tableErr) {
        logger.warn("⚠️ Could not verify/create 'chats' table:", tableErr.message);
      } finally {
        conn.release();
      }
    })
    .catch((err) => {
      logger.warn("⚠️ MySQL pool connection notice (server will run in memory fallback mode if DB is unreachable):", err.message);
    });
} catch (err) {
  logger.warn("⚠️ MySQL pool initialization notice:", err.message);
}

export const getDbPool = () => pool;
