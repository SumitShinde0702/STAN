import { generateExecutionProof, verifyExecutionProof } from "../prover-mock/index.js";

async function postJson(url, payload, apiKey) {
  const headers = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Prover API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export class ProverAdapter {
  constructor(config) {
    this.mode = config.proverMode;
    this.apiBaseUrl = config.prover.apiBaseUrl;
    this.apiKey = config.prover.apiKey;
  }

  async generate(payload) {
    if (this.mode === "http" && this.apiBaseUrl) {
      return postJson(`${this.apiBaseUrl}/prove`, payload, this.apiKey);
    }
    return generateExecutionProof(payload);
  }

  async verify(proof) {
    if (this.mode === "http" && this.apiBaseUrl) {
      const result = await postJson(`${this.apiBaseUrl}/verify`, { proof }, this.apiKey);
      return Boolean(result?.verified);
    }
    return verifyExecutionProof(proof);
  }
}
