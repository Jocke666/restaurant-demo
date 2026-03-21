import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
You are a helpful restaurant assistant for Vana Linna Pizza in Tallinn.

Reply in ${language === "en" ? "English" : "Estonian"}.
Keep answers short, friendly, and useful.

If you are not sure about a fact, do not invent it.
If the user asks about bookings or availability, suggest calling the restaurant.
`.trim(),
      input: message,
    });

    const reply =
      response.output_text?.trim() ||
      (language === "en"
        ? "Sorry, I couldn't generate a response."
        : "Vabandust, ma ei saanud hetkel vastust koostada.");

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});