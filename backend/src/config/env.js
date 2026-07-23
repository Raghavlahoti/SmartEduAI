import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  host: process.env.HOST || "0.0.0.0",
  appUrl: process.env.APP_URL || process.env.FRONTEND_URL || "https://edupilot-ai.vercel.app",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: (process.env.OPENROUTER_MODEL || "openrouter/free").trim(),
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "edupilot_db",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    ssl: process.env.DB_SSL === "true",
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  },
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 mins
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // max requests per window
};

export const validateEnv = () => {
  // ── API Key ────────────────────────────────────────────────────
  if (!config.openRouterApiKey) {
    logger.warn("⚠️  OPENROUTER_API_KEY is not set. AI responses will fail.");
  } else {
    logger.info("✓  OpenRouter API Key: configured");
  }

  // ── Model ──────────────────────────────────────────────────────
  if (!config.openRouterModel) {
    // Hard failure — an empty model string is a misconfiguration.
    const msg =
      "Configuration Error: OPENROUTER_MODEL is set to an empty string. " +
      'Set a valid model identifier in .env (e.g. OPENROUTER_MODEL=openrouter/free) or remove the variable to use the default.';
    logger.error(msg);
    throw new Error(msg);
  }

  logger.info(`✓  OpenRouter Model:   ${config.openRouterModel}`);
};
