import { logger } from "../utils/logger.js";

export const globalErrorHandler = (err, req, res, next) => {
  logger.error("Unhandled Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const responseMessage =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred on the server."
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    reply: responseMessage,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
