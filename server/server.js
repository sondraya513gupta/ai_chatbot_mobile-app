require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Pocket AI API" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey || apiKey === "put_your_groq_api_key_here") {
      return res.status(500).json({
        error: "Groq API key is not configured. Add GROQ_API_KEY to environment variables."
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Send a non-empty messages array." });
    }

    // Keep only supported roles and valid text. Limit history to avoid oversized requests.
    const cleanMessages = messages
      .filter((m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      )
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

    if (!cleanMessages.length || cleanMessages[cleanMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "The last message must be from the user." });
    }

    const model = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Pocket AI, a friendly assistant for everyday questions. " +
            "Answer clearly and simply. Prefer concise answers, explain unfamiliar terms, " +
            "and say when you are uncertain. Do not pretend to have accessed live information."
        },
        ...cleanMessages
      ],
      temperature: 0.6,
      max_tokens: 700
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error);
    const groqErrorMsg = error?.error?.message || error?.message || "";
    let message = "Could not get a response from Groq. Please try again.";

    if (error?.status === 401) {
      message = "Groq rejected the API key. Please check GROQ_API_KEY in Render environment variables.";
    } else if (error?.status === 404 || groqErrorMsg.toLowerCase().includes("model")) {
      const selectedModel = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
      message = `Invalid or unavailable model (${selectedModel}). Set GROQ_MODEL to llama-3.3-70b-versatile in Render.`;
    } else if (error?.status === 429) {
      message = "Groq rate limit or quota reached. Check your Groq account and try again later.";
    } else if (groqErrorMsg) {
      message = `Groq error: ${groqErrorMsg}`;
    }
    return res.status(502).json({ error: message, details: groqErrorMsg });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Pocket AI API running on http://localhost:${port}`);
});
