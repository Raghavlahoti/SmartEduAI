import app from "./src/app.js";
import { config, validateEnv } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";

// Validate Environment Variables
validateEnv();

const server = app.listen(config.port, () => {
  logger.info(`🚀 EduPilot AI Production Server running on http://localhost:${config.port}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed. Process terminating.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
