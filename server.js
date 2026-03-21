import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, language = "et" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const lang = language === "en" ? "English" : "Estonian";

    const instructions = `
You are a helpful restaurant assistant for Vana Linna Pizza in Tallinn.

Restaurant details:
- Address: Pikk 12, Tallinn
- Opening hours:
  Mon-Thu 11:00-21:00
  Fri-Sat 11:00-22:00
  Sun 12:00-20:00
- Bookings: Guests should call the restaurant to make a booking.
- Phone: +372 5555 5555

Reply in ${lang}.
Keep answers short, friendly, and useful.

If the user asks about opening hours, address, or bookings, use the restaurant details above.
If you are not sure about a fact, do not invent it.
If the user asks about bookings or availability, suggest calling the restaurant.
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions,
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
  console.log(`Server running on port ${port}`);
});