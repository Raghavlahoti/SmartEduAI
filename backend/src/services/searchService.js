import { logger } from "../utils/logger.js";

const REALTIME_KEYWORDS = [
  "latest news",
  "today news",
  "current price",
  "stock price today",
  "who won today",
  "live score",
  "weather today",
  "current president",
  "latest release",
  "breaking news",
];

export const isRealTimeQuery = (prompt) => {
  if (!prompt || typeof prompt !== "string") return false;
  const lower = prompt.toLowerCase();
  return REALTIME_KEYWORDS.some((kw) => lower.includes(kw));
};

export const performWebSearch = async (query) => {
  // Extensible Web Search Service Hook (e.g. Tavily / Brave Search API)
  // If no SEARCH_API_KEY is provided, return null to indicate live search is inactive.
  const searchApiKey = process.env.SEARCH_API_KEY;
  if (!searchApiKey) {
    logger.info("ℹ️ Live Web Search API key not configured. Returning offline notice.");
    return null;
  }

  // Future integration point for Tavily/Brave API
  try {
    logger.info(`🔍 Executing web search for query: "${query}"`);
    return null; 
  } catch (err) {
    logger.error("Web Search Error:", err.message);
    return null;
  }
};
