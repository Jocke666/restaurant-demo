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
  console.warn("Missing OPENAI_API_KEY in environment variables.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const businesses = {
  demo: {
    businessName: "Glow Beauty Studio",
    assistantName: "Beauty Booking Assistant",
    niche: "full-service beauty studio",
    intro: "hair, makeup, skincare, and beauty appointments",
    location: {
      address: "123 Madison Ave, New York, NY",
      city: "New York",
      parking: "Street parking nearby",
    },
    booking: {
      link: "https://example.com/book",
      availabilityNote:
        "Live calendar access is not connected, so direct clients to the booking link for current availability.",
    },
    hours: "Mon-Sat 9:00-7:00",
    services: {
      hair: [
        {
          name: "Color",
          price: "From $120",
          duration: "2-3 hours",
          description:
            "Hair color services based on the desired look and hair goals.",
        },
        {
          name: "Cut & Style",
          price: "$65",
          duration: "1 hour",
          description:
            "Haircut and styling for maintenance or a fresh new shape.",
        },
        {
          name: "Extensions",
          price: "Consultation required",
          duration: "Varies",
          description:
            "Extension services with consultation for matching and installation.",
        },
        {
          name: "Treatments",
          price: "From $45",
          duration: "45 minutes",
          description:
            "Hair treatments designed to improve moisture, strength, or shine.",
        },
      ],
      makeup: [
        {
          name: "Soft Glam",
          price: "$95",
          duration: "1 hour",
          description: "A polished, natural glam makeup look.",
        },
        {
          name: "Full Glam",
          price: "$130",
          duration: "1.5 hours",
          description: "A more defined, dramatic glam makeup look.",
        },
        {
          name: "Bridal Makeup",
          price: "From $180",
          duration: "Varies",
          description: "Bridal makeup for wedding day and related events.",
        },
        {
          name: "Event Makeup",
          price: "$110",
          duration: "1 hour",
          description: "Makeup for special occasions and events.",
        },
      ],
      skincare: [
        {
          name: "Facial",
          price: "$85",
          duration: "1 hour",
          description: "A skincare facial focused on cleansing and glow.",
        },
        {
          name: "Advanced Treatment",
          price: "From $120",
          duration: "75 minutes",
          description:
            "Targeted skin treatments depending on concerns and goals.",
        },
        {
          name: "Consultation",
          price: "$30",
          duration: "30 minutes",
          description:
            "A consultation to understand skin goals and recommend the best service.",
        },
      ],
    },
    policies: {
      deposit: "A deposit may be required for selected appointments.",
      cancellation: "24 hours notice is required for cancellations.",
      late: "Clients more than 15 minutes late may need to reschedule.",
      noShow: "Deposits are non-refundable for no-shows.",
      refund: "Service refunds are handled case by case.",
    },
    leadCaptureFields: [
      "name",
      "best contact info",
      "service interested in",
      "preferred day or time",
    ],
  },

  secondDemo: {
    businessName: "Luxe Skin Bar",
    assistantName: "Skin and Beauty Assistant",
    niche: "skin and beauty studio",
    intro: "facials, treatments, makeup, and beauty services",
    location: {
      address: "45 Atlantic Ave, Brooklyn, NY",
      city: "Brooklyn",
      parking: "Paid parking nearby",
    },
    booking: {
      link: "https://example.com/luxe-book",
      availabilityNote:
        "Availability should be checked through the booking link.",
    },
    hours: "Tue-Sun 10:00-6:00",
    services: {
      hair: [],
      makeup: [
        {
          name: "Soft Glam",
          price: "$100",
          duration: "1 hour",
          description: "Soft glam makeup for events and occasions.",
        },
      ],
      skincare: [
        {
          name: "Signature Facial",
          price: "$95",
          duration: "60 minutes",
          description: "A custom facial for hydration and glow.",
        },
        {
          name: "Acne Consultation",
          price: "$40",
          duration: "30 minutes",
          description:
            "Consultation to discuss skin concerns and treatment options.",
        },
      ],
    },
    policies: {
      deposit: "Deposit required for all first-time bookings.",
      cancellation: "24 hours notice required.",
      late: "Late arrivals may shorten the service time.",
      noShow: "No-show deposits are forfeited.",
      refund: "No refunds on completed services.",
    },
    leadCaptureFields: [
      "name",
      "phone or email",
      "service interested in",
      "preferred day or time",
    ],
  },
};

function getBusiness(clientId) {
  return businesses[clientId] || businesses.demo;
}

function buildBusinessContext(business) {
  return JSON.stringify(business, null, 2);
}

function getSystemPrompt(business) {
  return `
You are ${business.assistantName} for ${business.businessName}, a ${business.niche}.

Your job:
- answer beauty service questions clearly
- sound natural, short, and human
- guide clients toward booking
- collect lead details when they are not ready to book

Primary goal:
Every reply should do these two things:
1. answer the user's question
2. move them to the next step:
   - booking
   - choosing the right service
   - or leaving their details for follow-up

Rules:
- do not make up information
- only use the business info provided
- if a detail is missing, say that clearly and offer to collect lead info
- keep replies concise
- do not over-explain
- do not sound robotic
- do not sound overly salesy

Behavior:
- if the user asks about a service, answer directly and then offer the booking link or help choosing
- if the user asks about pricing, give the known price and invite booking
- if the user asks about location, answer simply and then guide to booking
- if the user asks about policies, answer briefly and then offer the next step
- if the user asks about availability, explain that live availability should be checked through the booking link unless direct booking access exists
- if the user is unsure what to choose, help narrow it down based on the result they want
- if the user is interested but not ready, collect lead details

Lead capture:
When useful, ask for:
- ${business.leadCaptureFields.join("\n- ")}

Unknown info response style:
- "I'm not fully sure on that, but I can take your details and have the studio confirm."
- "I can help with that, or I can take your details and have someone follow up."

Tone:
- friendly
- professional
- concise
- warm

Important:
Never end with a dead-end answer.
Always end by guiding them toward booking or lead capture.

Business data:
${buildBusinessContext(business)}
`;
}

function detectLeadCaptureIntent(message) {
  const text = message.toLowerCase();

  const triggers = [
    "not ready",
    "maybe later",
    "someone contact me",
    "can someone contact me",
    "follow up",
    "follow-up",
    "i'm not sure",
    "im not sure",
    "help me decide",
    "need help deciding",
    "not sure what to book",
    "not sure what i need",
  ];

  return triggers.some((phrase) => text.includes(phrase));
}

function getLeadCaptureNudge(business) {
  return `If they are not ready to book, offer to collect their ${business.leadCaptureFields.join(", ")}.`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], clientId = "demo" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const business = getBusiness(clientId);
    const leadCaptureIntent = detectLeadCaptureIntent(message);

    const systemPrompt = `
${getSystemPrompt(business)}

Extra guidance for this turn:
${
  leadCaptureIntent
    ? `The user appears hesitant or undecided. Prioritize lead capture. Ask for ${business.leadCaptureFields.join(", ")}.`
    : getLeadCaptureNudge(business)
}
`;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              ["user", "assistant"].includes(m.role)
          )
          .slice(-10)
      : [];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory,
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Empty response from AI." });
    }

    return res.json({
      reply,
      clientId,
      businessName: business.businessName,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error?.status === 401) {
      return res.status(500).json({
        error: "Invalid OpenAI API key.",
      });
    }

    if (error?.status === 429) {
      return res.status(429).json({
        error: "Rate limit reached. Try again shortly.",
      });
    }

    return res.status(500).json({
      error: "Server error while generating AI response.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});