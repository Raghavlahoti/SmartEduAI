import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { validateChatPrompt } from "./middleware/validate.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { handleChatPrompt } from "./controllers/chatController.js";
import { getHealthStatus } from "./controllers/healthController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow external CDN scripts like marked & DOMPurify
    crossOriginEmbedderPolicy: false,
  })
);

// Compression Middleware (Gzip)
app.use(compression());

// CORS Policy
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigin === "*") {
        return callback(null, true);
      }
      const allowedOrigins = config.corsOrigin.split(",").map((o) => o.trim());
      if (allowedOrigins.includes(origin) || allowedOrigins.some((domain) => origin.endsWith(domain.replace(/^\*/, "")))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan("combined", { stream: morganStream }));

// Static Frontend Serving
app.use(express.static(path.join(__dirname, "../../frontend")));

// API Routes & Rate Limiting
app.get("/api/health", getHealthStatus);
app.post("/chat", apiRateLimiter, validateChatPrompt, handleChatPrompt);

// Fallback SPA route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Centralized Global Error Handler
app.use(globalErrorHandler);

export default app;
