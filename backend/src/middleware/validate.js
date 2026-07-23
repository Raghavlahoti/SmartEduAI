const MAX_PROMPT_LENGTH = 20000;

export const validateChatPrompt = (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      reply: "Invalid request: Prompt must be a non-empty string.",
    });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      reply: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
    });
  }

  req.body.prompt = prompt.trim();
  next();
};
