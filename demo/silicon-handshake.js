import crypto from "node:crypto";
import { getConfig } from "../config/index.js";
import { createAgentIdentity, decryptBuyerRequest, encryptForSeller } from "../services/handshake/index.js";
import { createNexusClient } from "../services/nexus/index.js";
import { ProverAdapter } from "../services/prover-adapter/index.js";
import { createSettlementClient } from "../services/settlement/index.js";

function hashHex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function bytesFromHex(hex, count) {
  const clean = hex.replace(/^0x/, "");
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const start = (i * 2) % Math.max(clean.length - 1, 2);
    const pair = clean.slice(start, start + 2).padEnd(2, "0");
    out.push(Number.parseInt(pair, 16));
  }
  return out;
}

function buildTaskOutput(task, discussion) {
  const seed = hashHex(`${task}::${JSON.stringify(discussion)}`);
  const bytes = bytesFromHex(seed, 12);
  const wantsGraphs = /graph|chart|plot|visual/i.test(task);

  if (wantsGraphs) {
    const pointsA = bytes.slice(0, 6).map((v, i) => ({ x: i + 1, y: 20 + (v % 80) }));
    const pointsB = bytes.slice(6, 12).map((v, i) => ({ x: i + 1, y: 10 + (v % 60) }));
    return {
      kind: "graph_bundle",
      summary: "Generated two deterministic chart datasets from negotiated task context.",
      charts: [
        { title: "Demand Trend", type: "line", points: pointsA },
        { title: "Cost Spread", type: "bar", points: pointsB },
      ],
      seed,
    };
  }

  return {
    kind: "analysis_result",
    summary: `Executed private task plan for: ${task}`,
    score: bytes[0] % 100,
    confidenceBps: 5000 + (bytes[1] % 5000),
    seed,
  };
}

function getSellerAgentId(config) {
  return config.starknet.sellerAgentAddress || config.starknet.accountAddress || "seller-agent-001";
}

function pickMode(config, section, fallback) {
  const mode = config[section];
  return `${section}:${mode || fallback}`;
}

function txUrl(txHash) {
  return `https://sepolia.voyager.online/tx/${txHash}`;
}

export async function executeSiliconHandshake(options = {}) {
  const task = options.task || "private-ml-inference";
  const discussion = options.discussion || [];
  const discussionCommitment =
    options.discussionCommitment || (discussion.length > 0 ? hashHex(JSON.stringify(discussion)) : null);

  const flowStart = Date.now();
  const steps = [];
  const pushStep = (name, startedAt, details = {}) => {
    steps.push({
      name,
      durationMs: Date.now() - startedAt,
      ...details,
    });
  };

  const config = getConfig();
  const modes = {
    nexus: pickMode(config, "nexusMode", "mock"),
    settlement: pickMode(config, "btcMode", "sim"),
    prover: pickMode(config, "proverMode", "mock"),
  };

  const identityStart = Date.now();
  const buyer = createAgentIdentity("buyer-agent");
  const seller = createAgentIdentity("seller-agent");
  const sellerAgentId = getSellerAgentId(config);
  const capabilityRoot = hashHex("seller-strategy-v1-private-circuit");
  pushStep("Create identities + capability root", identityStart);

  let nexus;
  try {
    nexus = createNexusClient(config);
  } catch {
    nexus = createNexusClient({ ...config, nexusMode: "mock" });
  }

  const registerStart = Date.now();
  const registerResult = await nexus.registerCapabilityRoot({ agentId: sellerAgentId, capabilityRoot });
  pushStep("Register capability root on Nexus", registerStart, {
    txHash: registerResult?.txHash || null,
    description: "This commits seller capability fingerprint on-chain.",
  });

  const requestPayload = {
    capabilityHash: capabilityRoot,
    task,
    maxBudgetSats: 100_000,
    nonce: crypto.randomBytes(8).toString("hex"),
  };

  const handshakeStart = Date.now();
  const envelope = encryptForSeller({
    buyerPrivateKeyHex: buyer.privateKeyHex,
    sellerPublicKeyHex: seller.publicKeyHex,
    payload: requestPayload,
  });

  const decryptedBySeller = decryptBuyerRequest({
    sellerPrivateKeyHex: seller.privateKeyHex,
    buyerPublicKeyHex: buyer.publicKeyHex,
    envelope,
  });
  pushStep("Encrypt + decrypt private task intent", handshakeStart);

  const proveStart = Date.now();
  const prover = new ProverAdapter(config);
  const inputCommitment = discussionCommitment || hashHex(JSON.stringify(decryptedBySeller));
  const taskOutput = buildTaskOutput(task, discussion);
  const outputCommitment = hashHex(JSON.stringify(taskOutput));
  const proof = await prover.generate({
    capabilityRoot,
    inputCommitment,
    outputCommitment,
  });

  const proofValid = await prover.verify(proof);
  if (!proofValid) throw new Error("Proof generation failed verification");
  pushStep("Generate and locally verify proof artifact", proveStart, {
    proofHash: proof.proofHash,
  });

  const submitStart = Date.now();
  const verification = await nexus.submitExecutionProof({
    agentId: sellerAgentId,
    expectedCapabilityRoot: capabilityRoot,
    proof,
  });
  pushStep("Submit execution proof to Nexus", submitStart, {
    txHash: verification?.txHash || null,
    description: "This is the proof-verification transaction.",
  });

  const settlement = createSettlementClient(config);
  const escrow = settlement.createEscrow({
    escrowId: "escrow-001",
    satoshis: 90_000,
    buyer: buyer.label,
    seller: seller.label,
    proofHash: proof.proofHash,
    buyerPubkeyHex: buyer.publicKeyHex,
    sellerPubkeyHex: seller.publicKeyHex,
  });

  const verifyReadStart = Date.now();
  const isProofVerified = await nexus.isProofVerified(proof.proofHash);
  pushStep("Read proof status from Nexus", verifyReadStart, {
    status: isProofVerified ? "VERIFIED" : "NOT_VERIFIED",
  });

  const settleStart = Date.now();
  const released = settlement.releaseEscrow({
    escrowId: escrow.escrowId,
    isProofVerified,
    destinationAddress: config.bitcoin.destinationAddress,
    fundingTxid: config.bitcoin.fundingTxid,
    fundingVout: config.bitcoin.fundingVout,
    fundingValueSats: config.bitcoin.fundingValueSats,
    buyerWif: config.bitcoin.buyerWif,
    sellerWif: config.bitcoin.sellerWif,
    feeSats: config.bitcoin.feeSats,
  });
  pushStep("Advance settlement state using proof status", settleStart, {
    settlementState: released.state,
  });

  return {
    modes,
    runtime: {
      sellerAgentId,
      nexusContractAddress: config.starknet.contractAddress || null,
    },
    taskContext: {
      task,
      discussionCommitment: inputCommitment,
      outputCommitment,
      discussionMessageCount: discussion.length,
    },
    taskOutput,
    registerResult: {
      ...registerResult,
      txUrl: registerResult?.txHash ? txUrl(registerResult.txHash) : null,
    },
    verification: {
      ...verification,
      txUrl: verification?.txHash ? txUrl(verification.txHash) : null,
    },
    proofStatus: isProofVerified ? "VERIFIED" : "NOT_VERIFIED",
    settlement: released,
    timeline: {
      totalDurationMs: Date.now() - flowStart,
      steps,
    },
    handshakePreview: {
      envelope: {
        ...envelope,
        ciphertext: `${envelope.ciphertext.slice(0, 24)}...`,
      },
      decryptedBySeller,
    },
  };
}
