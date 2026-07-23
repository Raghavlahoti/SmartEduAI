import axios from "axios";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { isRealTimeQuery, performWebSearch } from "./searchService.js";

const PERSONA_SYSTEM_PROMPTS = {
  student: "You are EduPilot AI in Student Mode — an encouraging, patient tutor. Provide clear explanations, relatable analogies, step-by-step breakdowns, and memory hooks. Never invent or hallucinate real-time facts or current events. If asked about live events or current news and real-time search is unavailable, state clearly that you do not have live internet search capability.",
  teacher: "You are EduPilot AI in Teacher Mode — an expert pedagogy assistant. Assist with lesson planning, curriculum alignment, quiz and exam question generation, and grading rubrics. Never invent or hallucinate real-time facts or current events.",
  developer: "You are EduPilot AI in Developer Mode — a senior software engineering instructor. Focus on clean code, software architecture, algorithm analysis, line-by-line explanations, and debugging. Never invent or hallucinate real-time facts.",
};

export const generateAiResponse = async (prompt, mode = "student", customSystemPrompt = null) => {
  if (!config.openRouterApiKey) {
    logger.error("❌ OPENROUTER_API_KEY is not configured in server environment.");
    throw new Error("OPENROUTER_API_KEY is missing in server configuration. Please add a valid API key in .env.");
  }

  let systemMessage = customSystemPrompt || PERSONA_SYSTEM_PROMPTS[mode] || PERSONA_SYSTEM_PROMPTS.student;

  // Real-time query check
  let userContent = prompt;
  if (isRealTimeQuery(prompt)) {
    const searchResult = await performWebSearch(prompt);
    if (!searchResult) {
      userContent = `${prompt}\n\n[System Note: Live internet web search is currently unconfigured on the server. Please remind the user that live internet search capability is unavailable and provide information based strictly on your trained knowledge cutoff.]`;
    }
  }

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: userContent },
  ];

  const selectedModel = config.openRouterModel || "deepseek/deepseek-chat";
  logger.info(`🚀 Dispatching request to OpenRouter API (Model: ${selectedModel})`);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: selectedModel,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.appUrl,
          "X-Title": "EduPilot AI",
        },
        timeout: 45000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("No content returned from AI provider.");
    }

    return reply;
  } catch (error) {
    const status = error.response?.status;
    const errorDetails = error.response?.data || error.message;

    logger.error("OpenRouter API Service Error:", { status, details: errorDetails });

    if (status === 401) {
      throw new Error("Invalid OpenRouter API Key. Please check your credentials in .env.");
    } else if (status === 429) {
      throw new Error("OpenRouter API rate limit or quota exceeded. Please try again in a few moments.");
    } else if (status === 404) {
      throw new Error(`Configured OpenRouter model '${selectedModel}' was not found or is unavailable.`);
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request to OpenRouter API timed out after 45 seconds.");
    }

    throw new Error("Failed to generate AI response. Please check your network or try again later.");
  }
};
