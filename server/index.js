import cors from "cors";
import express from "express";
import crypto from "node:crypto";
import { executeSiliconHandshake } from "../demo/silicon-handshake.js";
import { getConfig } from "../config/index.js";

const app = express();
const port = Number.parseInt(process.env.STAN_API_PORT ?? "8787", 10);

app.use(cors());
app.use(express.json());

function hashHex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function deepseekDiscussion(task) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { source: "fallback:no_api_key", discussion: null };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are simulating a negotiation between two autonomous agents for a verifiable task market. Return exactly 4 concise turns as JSON array with fields: speaker, message.",
        },
        {
          role: "user",
          content: `Task: ${task}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API request failed: ${response.status}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const extractedJsonArray =
    (content.match(/\[[\s\S]*\]/)?.[0] || "").trim();

  const normalizeTurns = (turns) =>
    turns
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        speaker: `${t.speaker || t.role || "agent"}`.toLowerCase(),
        message: `${t.message || t.content || ""}`.trim(),
      }))
      .filter((t) => t.message.length > 0);

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const turns = normalizeTurns(parsed);
      if (turns.length > 0) return { source: "deepseek:json", discussion: turns };
    }
  } catch {
    // try extracted array
  }

  if (extractedJsonArray) {
    try {
      const parsed = JSON.parse(extractedJsonArray);
      if (Array.isArray(parsed)) {
        const turns = normalizeTurns(parsed);
        if (turns.length > 0) return { source: "deepseek:extracted_json", discussion: turns };
      }
    } catch {
      // continue
    }
  }

  if (content.trim().length > 0) {
    const lines = content
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    if (lines.length > 0) {
      const turns = lines.map((line, idx) => ({
        speaker: idx % 2 === 0 ? "buyer-agent" : "seller-agent",
        message: line,
      }));
      return { source: "deepseek:text_to_turns", discussion: turns };
    }
  }

  return { source: "fallback:empty_deepseek_content", discussion: null };
}

function fallbackDiscussion(task) {
  return [
    { speaker: "buyer-agent", message: `Task request: ${task}` },
    { speaker: "seller-agent", message: "Acknowledged. Capability hash matched in registry." },
    { speaker: "buyer-agent", message: "Payment release gated by proof verification on Nexus." },
    { speaker: "seller-agent", message: "Submitting proof after private execution." },
  ];
}

app.get("/api/health", (_req, res) => {
  const config = getConfig();
  res.json({
    ok: true,
    modes: {
      nexus: config.nexusMode,
      btc: config.btcMode,
      prover: config.proverMode,
    },
    contractAddress: config.starknet.contractAddress || null,
    accountAddress: config.starknet.accountAddress || null,
  });
});

app.post("/api/live/run", async (req, res) => {
  try {
    const result = await executeSiliconHandshake({
      task: req.body?.task,
      discussion: req.body?.discussion,
      discussionCommitment: req.body?.discussionCommitment,
    });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post("/api/agents/discuss", async (req, res) => {
  try {
    const task = (req.body?.task || "private-ml-inference").toString();
    const ai = await deepseekDiscussion(task);
    const discussion = ai.discussion || fallbackDiscussion(task);
    const commitment = hashHex(JSON.stringify(discussion));
    res.json({
      ok: true,
      task,
      discussion,
      commitment,
      source: ai.source,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`STAN API listening on http://localhost:${port}`);
});
