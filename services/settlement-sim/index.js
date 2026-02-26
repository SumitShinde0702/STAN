export class SettlementSimulator {
  constructor() {
    this.escrows = new Map();
  }

  createEscrow({ escrowId, satoshis, buyer, seller, proofHash }) {
    if (this.escrows.has(escrowId)) {
      throw new Error(`Escrow already exists: ${escrowId}`);
    }

    this.escrows.set(escrowId, {
      escrowId,
      satoshis,
      buyer,
      seller,
      proofHash,
      state: "LOCKED",
      createdAt: new Date().toISOString(),
      releasedAt: null,
    });

    return this.escrows.get(escrowId);
  }

  releaseEscrow({ escrowId, isProofVerified }) {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error(`Escrow not found: ${escrowId}`);
    if (!isProofVerified) throw new Error("Proof not verified by Nexus");
    if (escrow.state !== "LOCKED") throw new Error(`Escrow already ${escrow.state}`);

    escrow.state = "RELEASED";
    escrow.releasedAt = new Date().toISOString();
    return escrow;
  }

  getEscrow(escrowId) {
    return this.escrows.get(escrowId);
  }
}
