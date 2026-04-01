import { useState } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "demo";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help with services, pricing, policies, and booking. What kind of beauty service are you looking for?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (customMessage) => {
    const text = (customMessage ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: CLIENT_ID,
          message: text,
          history: newMessages.slice(-10),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What services do you offer?",
    "How much is a facial?",
    "Do you do makeup for events?",
    "I need help choosing a service",
    "How do I book an appointment?",
    "What is your cancellation policy?",
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Beauty Booking Assistant</h1>
        <p style={styles.subtitle}>
          Answers beauty service questions and helps clients book
        </p>

        <div style={styles.chat}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                ...(msg.role === "user" ? styles.user : styles.assistant),
              }}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p style={{ margin: "4px 0" }}>{children}</p>
                    ),
                    li: ({ children }) => (
                      <li style={{ marginBottom: 4 }}>{children}</li>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ paddingLeft: 22, margin: "4px 0" }}>
                        {children}
                      </ol>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ paddingLeft: 22, margin: "4px 0" }}>
                        {children}
                      </ul>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.message, ...styles.assistant }}>
              Thinking...
            </div>
          )}
        </div>

        <div style={styles.quickRow}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              style={styles.quickBtn}
              onClick={() => sendMessage(q)}
              type="button"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={styles.inputRow}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about services, pricing, location, booking, or policies..."
            style={styles.input}
          />

          <button style={styles.button} type="submit" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Inter, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 720,
    background: "white",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    marginTop: 6,
    color: "#666",
    marginBottom: 16,
  },
  chat: {
    height: 420,
    overflowY: "auto",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#fafafa",
  },
  message: {
    padding: "12px 14px",
    borderRadius: 10,
    maxWidth: "90%",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  user: {
    alignSelf: "flex-end",
    background: "#111",
    color: "white",
  },
  assistant: {
    alignSelf: "flex-start",
    background: "#eee",
    color: "#222",
  },
  quickRow: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontSize: 12,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  button: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "#111",
    color: "white",
    cursor: "pointer",
  },
};