import dotenv from "dotenv";

dotenv.config({ quiet: true, override: true });

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const task = process.argv.slice(2).join(" ").trim() || "Generate graphs for BTC settlement strategy";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY missing in .env");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Return exactly 4 short dialogue turns as JSON array. Each item: {\"speaker\":\"buyer-agent|seller-agent\",\"message\":\"...\"}. No extra text.",
        },
        {
          role: "user",
          content: `Task: ${task}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("DeepSeek test failed:", response.status, data);
    process.exit(1);
  }

  const content = data?.choices?.[0]?.message?.content ?? "";
  console.log("DeepSeek connection: OK");
  console.log(`Model: ${model}`);
  console.log("Raw content:");
  console.log(content);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
