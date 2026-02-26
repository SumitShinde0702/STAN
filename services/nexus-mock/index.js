import { verifyExecutionProof } from "../prover-mock/index.js";

export class NexusMock {
  constructor() {
    this.capabilityRoots = new Map();
    this.verifiedProofs = new Set();
  }

  registerCapabilityRoot({ agentId, capabilityRoot }) {
    this.capabilityRoots.set(agentId, capabilityRoot);
    return { agentId, capabilityRoot };
  }

  submitExecutionProof({ agentId, expectedCapabilityRoot, proof }) {
    const registeredRoot = this.capabilityRoots.get(agentId);
    if (!registeredRoot) throw new Error("Agent capability root missing");
    if (registeredRoot !== expectedCapabilityRoot) {
      throw new Error("Capability root mismatch");
    }
    if (!verifyExecutionProof(proof)) {
      throw new Error("Invalid proof");
    }

    this.verifiedProofs.add(proof.proofHash);
    return {
      agentId,
      capabilityRoot: expectedCapabilityRoot,
      proofHash: proof.proofHash,
      computationalIntegrity: true,
    };
  }

  isProofVerified(proofHash) {
    return this.verifiedProofs.has(proofHash);
  }
}
