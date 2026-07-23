import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    reply: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
