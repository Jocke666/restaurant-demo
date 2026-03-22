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

function getSystemPrompt() {
  return `
You are an AI assistant for a Shopify beauty store.

Your goals:
- answer customer questions clearly
- help customers choose the right beauty products
- explain product benefits, usage, ingredients, prices, and differences
- answer store policy questions using only the provided policy data
- reduce support workload
- increase conversions in a helpful, non-pushy way

You can help with:
- product recommendations
- prices
- ingredients
- how to use products
- skin type compatibility
- hair type compatibility
- product comparisons
- bundles and offers
- shipping
- returns
- support contact questions
- general store questions

Behavior rules:
- keep answers clear, friendly, and concise
- do NOT invent product details such as price, ingredients, stock, reviews, shipping times, or policies
- only use catalog and policy information that is explicitly provided
- if information is missing, say that clearly
- avoid medical claims or diagnosing conditions
- for sensitive skin or allergy concerns, suggest patch testing and checking the ingredient list
- when recommending products, base the recommendation on the customer's stated needs
- when helpful, ask 1 short follow-up question
- when comparing products, explain who each product is best for
- if the customer asks about a specific product, answer directly first and then guide further if useful
- if the catalog or policy data does not contain the answer, say that live store data is not connected yet and provide only general guidance

Tone:
- helpful
- trustworthy
- beauty-focused
- not pushy
`;
}

function getMockProducts() {
  return [
    {
      id: "prod_1",
      title: "Hydrating Hyaluronic Serum",
      price: "29.00",
      currency: "EUR",
      category: "serum",
      skinType: ["dry", "normal", "sensitive"],
      hairType: [],
      concerns: ["dehydration", "dryness", "dullness"],
      ingredients: ["Hyaluronic Acid", "Panthenol", "Glycerin"],
      description:
        "A lightweight hydrating serum designed to replenish moisture and support the skin barrier.",
      howToUse:
        "Apply 2-3 drops to clean skin before moisturizer, morning and evening.",
      tags: ["hydrating", "fragrance-free", "sensitive-skin-friendly"],
      inStock: true,
      productUrl: "/products/hydrating-hyaluronic-serum",
    },
    {
      id: "prod_2",
      title: "Vitamin C Glow Serum",
      price: "34.00",
      currency: "EUR",
      category: "serum",
      skinType: ["normal", "combination", "oily"],
      hairType: [],
      concerns: ["dullness", "uneven tone", "lack of radiance"],
      ingredients: ["Vitamin C", "Ferulic Acid", "Aloe Vera"],
      description:
        "A brightening serum that helps improve the look of uneven tone and boost radiance.",
      howToUse:
        "Apply in the morning after cleansing, followed by moisturizer and SPF.",
      tags: ["brightening", "glow", "antioxidant"],
      inStock: true,
      productUrl: "/products/vitamin-c-glow-serum",
    },
    {
      id: "prod_3",
      title: "Barrier Repair Moisturizer",
      price: "24.00",
      currency: "EUR",
      category: "moisturizer",
      skinType: ["dry", "sensitive"],
      hairType: [],
      concerns: ["dryness", "barrier support", "redness"],
      ingredients: ["Ceramides", "Squalane", "Shea Butter"],
      description:
        "A rich moisturizer designed to support the skin barrier and reduce dryness.",
      howToUse:
        "Apply after serum as the final step in your skincare routine.",
      tags: ["barrier-care", "nourishing", "sensitive-skin-friendly"],
      inStock: true,
      productUrl: "/products/barrier-repair-moisturizer",
    },
    {
      id: "prod_4",
      title: "Clarifying Gel Cleanser",
      price: "19.00",
      currency: "EUR",
      category: "cleanser",
      skinType: ["oily", "combination"],
      hairType: [],
      concerns: ["oiliness", "clogged pores", "breakouts"],
      ingredients: ["Niacinamide", "Green Tea Extract", "Glycerin"],
      description:
        "A fresh gel cleanser that helps remove excess oil and impurities without stripping the skin.",
      howToUse:
        "Massage onto damp skin, rinse with lukewarm water, and follow with serum or moisturizer.",
      tags: ["clarifying", "lightweight", "daily-cleanser"],
      inStock: true,
      productUrl: "/products/clarifying-gel-cleanser",
    },
    {
      id: "prod_5",
      title: "Nourishing Repair Hair Mask",
      price: "27.00",
      currency: "EUR",
      category: "hair-mask",
      skinType: [],
      hairType: ["dry", "damaged", "color-treated"],
      concerns: ["damage", "frizz", "dry ends"],
      ingredients: ["Argan Oil", "Keratin", "Shea Butter"],
      description:
        "A deeply nourishing hair mask formulated to soften, smooth, and strengthen dry or damaged hair.",
      howToUse:
        "Apply to clean, damp hair from mid-lengths to ends. Leave on for 5-10 minutes, then rinse thoroughly.",
      tags: ["repair", "nourishing", "frizz-control"],
      inStock: true,
      productUrl: "/products/nourishing-repair-hair-mask",
    },
    {
      id: "prod_6",
      title: "Soothing Scalp Treatment",
      price: "31.00",
      currency: "EUR",
      category: "scalp-treatment",
      skinType: [],
      hairType: ["sensitive-scalp", "normal", "dry"],
      concerns: ["itchiness", "dry scalp", "sensitivity"],
      ingredients: ["Panthenol", "Allantoin", "Oat Extract"],
      description:
        "A calming scalp treatment designed to comfort dry or sensitive scalps and support scalp balance.",
      howToUse:
        "Apply directly to the scalp after washing or as needed. Do not rinse.",
      tags: ["scalp-care", "soothing", "sensitive"],
      inStock: false,
      productUrl: "/products/soothing-scalp-treatment",
    },
  ];
}

function getMockStorePolicies() {
  return {
    storeName: "Glow Theory Beauty",
    currency: "EUR",
    shipping: {
      regions: ["Estonia", "Latvia", "Lithuania", "Finland"],
      standardDelivery: "2-5 business days",
      expressDelivery: "1-2 business days",
      freeShippingThreshold: "50.00 EUR",
      standardShippingCost: "4.90 EUR",
      expressShippingCost: "9.90 EUR",
      internationalShipping: false,
    },
    returns: {
      returnWindowDays: 14,
      openedBeautyProductsReturnable: false,
      unopenedBeautyProductsReturnable: true,
      returnCondition:
        "Products must be unused, unopened, and in original packaging.",
      refundProcessingTime:
        "5-7 business days after the return is received and approved.",
    },
    support: {
      email: "support@glowtheorybeauty.com",
      responseTime: "within 24 business hours",
      businessHours: "Monday to Friday, 9:00-17:00",
    },
    faq: {
      veganProducts:
        "Some products are vegan, but not all. Check individual product details.",
      crueltyFree: "All products in the current demo catalog are cruelty-free.",
      fragranceFree:
        "Not every product is fragrance-free. Customers should check the individual product information.",
    },
  };
}

async function getStoreProducts() {
  return getMockProducts();
}

async function getStorePolicies() {
  return getMockStorePolicies();
}

function buildCatalogContext(products) {
  return JSON.stringify(products, null, 2);
}

function buildPolicyContext(policies) {
  return JSON.stringify(policies, null, 2);
}

function findRelevantProducts(products, userMessage) {
  const query = userMessage.toLowerCase();

  const scoredProducts = products.map((product) => {
    let score = 0;

    const fields = [
      product.title,
      product.category,
      product.description,
      ...(product.skinType || []),
      ...(product.hairType || []),
      ...(product.concerns || []),
      ...(product.ingredients || []),
      ...(product.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (product.title?.toLowerCase().includes(query)) score += 10;
    if (product.category?.toLowerCase().includes(query)) score += 5;

    const queryWords = query.split(/\s+/).filter(Boolean);

    for (const word of queryWords) {
      if (word.length < 2) continue;
      if (fields.includes(word)) score += 2;
    }

    if (query.includes("dry") && product.skinType?.includes("dry")) score += 4;
    if (query.includes("sensitive") && product.skinType?.includes("sensitive")) score += 4;
    if (query.includes("oily") && product.skinType?.includes("oily")) score += 4;
    if (query.includes("combination") && product.skinType?.includes("combination")) score += 4;
    if (query.includes("damaged") && product.hairType?.includes("damaged")) score += 4;
    if (query.includes("dry scalp") && product.concerns?.includes("dry scalp")) score += 4;
    if (query.includes("frizz") && product.concerns?.includes("frizz")) score += 4;
    if (query.includes("dull") && product.concerns?.some((c) => c.toLowerCase().includes("dull"))) score += 4;
    if (
      query.includes("vitamin c") &&
      product.ingredients?.some((i) => i.toLowerCase().includes("vitamin c"))
    ) {
      score += 6;
    }
    if (
      query.includes("hyaluronic") &&
      product.ingredients?.some((i) => i.toLowerCase().includes("hyaluronic"))
    ) {
      score += 6;
    }
    if (
      query.includes("ceramide") &&
      product.ingredients?.some((i) => i.toLowerCase().includes("ceramide"))
    ) {
      score += 6;
    }

    return { product, score };
  });

  return scoredProducts
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.product);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const products = await getStoreProducts();
    const policies = await getStorePolicies();

    const relevantProducts = findRelevantProducts(products, message);
    const productsForPrompt = relevantProducts.length > 0 ? relevantProducts : products;

    const systemPrompt = `
${getSystemPrompt()}

Relevant store products:
${buildCatalogContext(productsForPrompt)}

Store policies and business info:
${buildPolicyContext(policies)}
`;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              ["user", "assistant"].includes(m.role)
          )
          .slice(-8)
      : [];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
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

    return res.json({ reply });
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
  console.log(`Server running on http://localhost:${port}`);
});