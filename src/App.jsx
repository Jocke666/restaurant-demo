import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const [language, setLanguage] = useState("et");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        language === "et"
          ? "Tere! Olen restorani assistent. Küsi julgelt 🙂"
          : "Hi! I'm the restaurant assistant. Feel free to ask 🙂",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text:
          language === "et"
            ? "Tere! Olen restorani assistent. Küsi julgelt 🙂"
            : "Hi! I'm the restaurant assistant. Feel free to ask 🙂",
      },
    ]);
    setInput("");
  }, [language]);

  const sendMessage = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: value },
      { role: "assistant", text: "..." },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value, language }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text:
            data.reply ||
            (language === "et"
              ? "Vabandust, vastust ei tulnud."
              : "Sorry, no reply was received."),
        };
        return updated;
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text:
  language === "et"
    ? "AI teenus on hetkel ajutiselt maas."
    : "The AI service is temporarily unavailable.",
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions =
    language === "et"
      ? [
          "Kas te olete avatud?",
          "Ma tahan broneerida",
          "Kas teil on menüü?",
        ]
      : ["Are you open?", "I want to book", "Do you have a menu?"];

  const title = "Vana Linna Pizza";

  const subtitle =
    language === "et"
      ? "Hubane pitsa- ja pastakoht Tallinna kesklinnas"
      : "Cozy pizza and pasta restaurant in central Tallinn";

  const inputPlaceholder =
    language === "et" ? "Kirjuta oma küsimus..." : "Type your question...";

  const sendButtonText = loading ? "..." : language === "et" ? "Saada" : "Send";

  const callButtonText = language === "et" ? "📞 Helista nüüd" : "📞 Call now";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          padding: "32px",
        }}
      >
        <div style={{ textAlign: "right", marginBottom: "16px" }}>
          <button
            onClick={() => setLanguage("et")}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: language === "et" ? "#111827" : "#f9fafb",
              color: language === "et" ? "#ffffff" : "#111827",
              cursor: loading ? "not-allowed" : "pointer",
              marginRight: "8px",
            }}
          >
            EST
          </button>

          <button
            onClick={() => setLanguage("en")}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: language === "en" ? "#111827" : "#f9fafb",
              color: language === "en" ? "#ffffff" : "#111827",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            EN
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "48px",
              lineHeight: 1.1,
              color: "#111827",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "12px",
              marginBottom: 0,
              fontSize: "20px",
            }}
          >
            {subtitle}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            height: "340px",
            overflowY: "auto",
            marginBottom: "16px",
            background: "#f9fafb",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  background: m.role === "user" ? "#111827" : "#e5e7eb",
                  color: m.role === "user" ? "#ffffff" : "#111827",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  maxWidth: "75%",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder={inputPlaceholder}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "15px",
            }}
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#111827",
              color: "#ffffff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {sendButtonText}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href="tel:+37255551234"
            style={{
              background: "#dc2626",
              color: "#ffffff",
              padding: "12px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "bold",
            }}
          >
            {callButtonText}
          </a>
        </div>
      </div>
    </div>
  );
}