import { generateAiResponse } from "../services/openRouterService.js";
import { getDbPool } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const handleChatPrompt = async (req, res, next) => {
  const { prompt, mode, customSystemPrompt } = req.body;

  try {
    const reply = await generateAiResponse(prompt, mode, customSystemPrompt);

    // Save to database asynchronously
    const dbPool = getDbPool();
    if (dbPool) {
      dbPool.query("INSERT INTO chats (prompt, reply) VALUES (?, ?)", [prompt, reply])
        .then(() => logger.info("✅ Chat saved to database"))
        .catch((err) => logger.warn("⚠️ Chat database save notice:", err.message));
    }

    return res.json({ reply });
  } catch (error) {
    next(error);
  }
};
