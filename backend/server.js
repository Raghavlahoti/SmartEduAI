import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import mysql from "mysql2"; // ✅ Import MySQL

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ✅ MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

app.post("/chat", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "SmartEdu",
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    // ✅ Optional: Save chat to database
    db.query(
      "INSERT INTO chats (prompt, reply) VALUES (?, ?)",
      [prompt, reply],
      (err, results) => {
        if (err) {
          console.error("❌ Error saving chat to DB:", err);
        } else {
          console.log("✅ Chat saved to DB");
        }
      }
    );

    res.json({ reply });
  } catch (error) {
    console.error("OpenRouter error:", error.response?.data || error.message);
    res.status(500).json({ reply: "Error getting response from OpenRouter." });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
