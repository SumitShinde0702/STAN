# STAN (Starknet Agent Nexus)

STAN is the **Protocol for Verifiable Agent Cooperation**: a middleware layer between **Bitcoin L1 (Money)** and **Starknet L2 (Intelligence)**.

Instead of trusting agent claims, STAN enforces **Computational Integrity** with STARK proofs and unlocks Bitcoin settlement only when verified work is proven.

---

## Why STAN

In the 2026 agent economy, the core problem is **Capability Fraud**:

- Agents claim they can run private strategies or ML logic
- Counterparties cannot verify execution without revealing proprietary code
- High-value payments require trust, reputation, or centralized escrow

STAN fixes this by making proof of execution a settlement precondition.

---

## The Silicon Handshake

### 1) Verification Layer: Proof of Intelligence

- Agent logic runs in an **S-two STARK-friendly VM**
- Proof generation uses **Circle STARKs over M31** (`2^31 - 1`) for fast proving on commodity hardware
- A Starknet Cairo 2.x Nexus contract stores **capability root hashes**
- Agents submit proof-of-execution against a registered capability root
- Nexus validates via `verify_proof` and records a verified result

Outcome: the network verifies work correctness without revealing private internals.

### 2) Trust-Minimized Settlement: Bitcoin Bridge

- Bitcoin funds are locked in a 2-of-2 setup between Agent and STAN Escrow
- Unlock secret material is split; one component is gated by Starknet contract logic
- Settlement release is triggered only after verified proof from Nexus
- Bridge design can be implemented through **DLC-style flows** and covenant-compatible scripts (including future `OP_CAT` paths)

Outcome: if proof is missing, BTC cannot move. Math enforces execution-gated payout.

### 3) Privacy Layer: Shielded Intentions

- Buyer requests are encrypted with Seller public keys from on-chain registry
- Buyers discover capabilities by hash, not by exposed strategy metadata
- Identity and intent remain shielded until handshake stage

Outcome: anti-scraping, anti-front-running, private agent marketplaces.

### 4) Identity Layer: ERC-8004 + Account Abstraction

- Each agent is a **modular account**, not just a wallet address
- **Session keys** support high-frequency autonomous updates and micropayments
- **Guardians / programmable controls** enforce policy thresholds (for example, human approval above 1 BTC)

Outcome: secure autonomy with bounded risk.

---

## Technical Narrative for Judges

STAN highlights three core properties:

1. **Quantum-Resistance via STARKs**  
   While Bitcoin’s signature layer faces long-term quantum risk, STAN’s proof system is STARK-based and quantum-safe at the verification layer.

2. **Computational Integrity**  
   STAN does not trust agent claims. It verifies cryptographic evidence of correct execution before allowing value transfer.

3. **Hyper-Scalability**  
   Fast proving and small proof verification on Starknet enable massive agent-to-agent throughput compared with L1-only settlement models.

---

## Vision

STAN is not just a bridge or a marketplace.  
It is the **Central Nervous System of the Agentic Internet**.

---

## Quickstart (Hackathon Demo)

- Install Node.js 20+
- Copy `.env.example` to `.env` and fill values when running live modes
- Run `npm run demo`
- Observe the flow: capability registration -> encrypted handshake -> proof verification -> escrow release

Optional live switch (with configured `.env`):

- Set `STAN_NEXUS_MODE=chain` to use Starknet Sepolia
- Set `STAN_BTC_MODE=btc` to use Bitcoin testnet transaction builder
- Set `STAN_PROVER_MODE=http` to use external prover endpoints

---

## Real On-Chain Flow (Starknet Sepolia)

1. Fill `.env`:
   - `STAN_NEXUS_MODE=chain`
   - `STARKNET_RPC_URL` (Sepolia RPC)
   - `STARKNET_ACCOUNT_ADDRESS`
   - `STARKNET_PRIVATE_KEY`
   - `STARKNET_NEXUS_CONTRACT_ADDRESS` (after deployment)
2. Run health check:
   - `npm run starknet:doctor`
3. Register seller capability root on-chain:
   - `npm run starknet:register`
4. Submit execution proof on-chain:
   - `npm run starknet:proof`

Deployment command (requires compiled artifacts):

- `npm run starknet:deploy`
- Artifact paths expected by deploy script:
  - `contracts/artifacts/nexus.contract_class.json`
  - `contracts/artifacts/nexus.compiled_contract_class.json`

Note: Cairo compiler toolchain is required to generate these artifacts.

---

## Current Repository Layout

- `contracts/nexus.cairo`: Cairo Nexus contract scaffold for capability roots and proof status
- `services/prover-mock/index.js`: mock proof generator/verifier (placeholder for S-two integration)
- `services/prover-adapter/index.js`: external prover API adapter with mock fallback
- `services/nexus-mock/index.js`: local Nexus verifier state machine
- `services/nexus-chain/index.js`: Starknet Sepolia contract adapter
- `services/nexus/index.js`: Nexus adapter factory (mock or chain)
- `services/handshake/index.js`: encrypted buyer-seller payload exchange
- `services/settlement-sim/index.js`: proof-gated Bitcoin settlement simulation
- `services/settlement-btc/index.js`: Bitcoin testnet/regtest 2-of-2 P2WSH escrow builder
- `services/settlement/index.js`: settlement adapter factory (sim or btc)
- `config/index.js`: environment-driven runtime configuration
- `scripts/starknet/*.js`: on-chain doctor, deploy, register, and proof scripts
- `demo/run-demo.js`: end-to-end Silicon Handshake demo runner
- `AI.md`: persistent architecture context and implementation constraints

---

## Repository Status

STAN now includes an end-to-end **prototype scaffold** for live judging demos.  
Next step is swapping mocks with production components:

- Real Cairo deployment + verifier syscall wiring
- Real S-two proof pipeline
- Bitcoin testnet DLC/covenant execution path
