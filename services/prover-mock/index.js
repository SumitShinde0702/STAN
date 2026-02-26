import crypto from "node:crypto";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Mock proof generation.
 * In production this is replaced by S-two / Circle STARK proof generation.
 */
export function generateExecutionProof({ capabilityRoot, inputCommitment, outputCommitment }) {
  const transcript = JSON.stringify({
    capabilityRoot,
    inputCommitment,
    outputCommitment,
    m31Field: "2^31-1",
    scheme: "circle-stark-mock",
  });

  const proofHash = sha256Hex(transcript);
  return {
    proofHash,
    transcriptHash: proofHash,
    metadata: {
      capabilityRoot,
      field: "M31",
      computationalIntegrity: true,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Mock verifier.
 * Validates shape and deterministic hash to emulate verifier acceptance.
 */
export function verifyExecutionProof(proof) {
  if (!proof || typeof proof !== "object") return false;
  if (!proof.proofHash || !proof.metadata?.capabilityRoot) return false;
  return /^[a-f0-9]{64}$/.test(proof.proofHash);
}
