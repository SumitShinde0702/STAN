import crypto from "node:crypto";
import { getConfig } from "../config/index.js";
import { createAgentIdentity, decryptBuyerRequest, encryptForSeller } from "../services/handshake/index.js";
import { createNexusClient } from "../services/nexus/index.js";
import { ProverAdapter } from "../services/prover-adapter/index.js";
import { createSettlementClient } from "../services/settlement/index.js";

function hashHex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function print(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
}

function getSellerAgentId(config) {
  return config.starknet.sellerAgentAddress || "seller-agent-001";
}

function pickMode(config, section, fallback) {
  const mode = config[section];
  return `${section}:${mode || fallback}`;
}

async function run() {
  const config = getConfig();
  console.log("STAN Demo: Silicon Handshake (Hackathon Prototype)");
  print("Runtime Modes", {
    nexus: pickMode(config, "nexusMode", "mock"),
    settlement: pickMode(config, "btcMode", "sim"),
    prover: pickMode(config, "proverMode", "mock"),
  });

  // 1) Agent identities and capability registration
  const buyer = createAgentIdentity("buyer-agent");
  const seller = createAgentIdentity("seller-agent");
  const sellerAgentId = getSellerAgentId(config);
  const capabilityRoot = hashHex("seller-strategy-v1-private-circuit");

  let nexus;
  try {
    nexus = createNexusClient(config);
  } catch (error) {
    console.warn(`Nexus fallback to mock: ${error.message}`);
    nexus = createNexusClient({ ...config, nexusMode: "mock" });
  }

  const registerResult = await nexus.registerCapabilityRoot({ agentId: sellerAgentId, capabilityRoot });
  print("Capability Root Registered", registerResult);

  // 2) Buyer sends encrypted task intent to seller (Shielded Intentions)
  const requestPayload = {
    capabilityHash: capabilityRoot,
    task: "private-ml-inference",
    maxBudgetSats: 100_000,
    nonce: crypto.randomBytes(8).toString("hex"),
  };

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

  print("Encrypted Handshake", {
    envelopePreview: { ...envelope, ciphertext: `${envelope.ciphertext.slice(0, 24)}...` },
    decryptedBySeller,
  });

  // 3) Seller executes private logic and generates execution proof via adapter
  const prover = new ProverAdapter(config);
  const proof = await prover.generate({
    capabilityRoot,
    inputCommitment: hashHex(JSON.stringify(decryptedBySeller)),
    outputCommitment: hashHex("output-commitment-placeholder"),
  });
  const proofValid = await prover.verify(proof);
  if (!proofValid) throw new Error("Proof generation failed verification");

  const verification = await nexus.submitExecutionProof({
    agentId: sellerAgentId,
    expectedCapabilityRoot: capabilityRoot,
    proof,
  });

  print("Nexus Proof Verification", verification);

  // 4) Settlement unlock is gated by verified proof (VLS)
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

  const isProofVerified = await nexus.isProofVerified(proof.proofHash);
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

  print("Settlement Result", released);

  const outcome =
    released.state === "SIGNED_TX_READY" || released.state === "RELEASED"
      ? "Escrow released or signed for release"
      : "Escrow waiting for funding/signatures";
  console.log(`\nResult: Proof verified -> ${outcome}`);
  console.log("Narrative tags: Quantum-Resistance via STARKs, Computational Integrity, Hyper-Scalability");
}

run().catch((error) => {
  console.error("\nDemo failed:", error.message);
  process.exit(1);
});
