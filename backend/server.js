import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// ✅ MySQL Pool Connection Setup with Auto Table Creation
let dbPool = null;
try {
  dbPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smartedu_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Verify database connection & initialize table on startup
  dbPool
    .getConnection()
    .then(async (conn) => {
      console.log("✅ Connected to MySQL database pool");
      try {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS chats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            prompt TEXT NOT NULL,
            reply TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Verified MySQL 'chats' table existence");
      } catch (tableErr) {
        console.warn("⚠️ Could not verify/create 'chats' table:", tableErr.message);
      } finally {
        conn.release();
      }
    })
    .catch((err) => {
      console.warn(
        "⚠️ MySQL connection warning (DB operations will be skipped if DB is unreachable):",
        err.message
      );
    });
} catch (err) {
  console.warn("⚠️ MySQL pool creation skipped:", err.message);
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(OPENROUTER_API_KEY),
    databaseConfigured: Boolean(dbPool),
  });
});

// Chat Completion Endpoint
app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ reply: "Please provide a valid prompt string." });
  }

  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ OPENROUTER_API_KEY is missing in backend/.env file.");
    return res.status(500).json({
      reply: "Backend API Key is missing. Please configure OPENROUTER_API_KEY in backend/.env file.",
    });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt.trim() }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "SmartEdu",
        },
        timeout: 30000,
      }
    );

    const reply =
      response.data?.choices?.[0]?.message?.content || "No content received from AI model.";

    // ✅ Save chat to database asynchronously using promise-based pool
    if (dbPool) {
      dbPool
        .query("INSERT INTO chats (prompt, reply) VALUES (?, ?)", [prompt.trim(), reply])
        .then(() => console.log("✅ Chat saved to DB"))
        .catch((err) => console.error("❌ Error saving chat to DB:", err.message));
    }

    return res.json({ reply });
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("OpenRouter API error:", errorDetails);
    return res.status(500).json({
      reply: "Error getting response from AI service. Please check server logs.",
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT} (Accessible via http://localhost:${PORT} or http://127.0.0.1:${PORT})`);
});
