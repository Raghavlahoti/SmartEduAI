import { config } from "../config/env.js";
import { getDbPool } from "../config/database.js";

export const getHealthStatus = async (req, res) => {
  const dbPool = getDbPool();
  let dbStatus = "disconnected";

  if (dbPool) {
    try {
      const conn = await dbPool.getConnection();
      conn.release();
      dbStatus = "connected";
    } catch {
      dbStatus = "error";
    }
  }

  res.json({
    status: "ok",
    environment: config.env,
    timestamp: new Date().toISOString(),
    services: {
      openRouterApiKeyConfigured: Boolean(config.openRouterApiKey),
      database: dbStatus,
    },
  });
};
