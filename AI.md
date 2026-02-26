# AI Build Context: STAN (Starknet Agent Nexus)

This file is the persistent context for the coding agent.  
Use it as the source of truth for architecture intent, terminology, and design constraints.

---

## One-Line Mission

Build the **Protocol for Verifiable Agent Cooperation**: a middleware system that connects Bitcoin value settlement with Starknet verifiable intelligence.

---

## Core Architecture Name

**The Silicon Handshake**

STAN sits between:

- **Bitcoin L1** = money and final high-value settlement
- **Starknet L2** = logic verification, policy enforcement, and autonomous agent operations

---

## Problem Statement

### Capability Fraud

In agent markets, an agent can claim it ran private logic (ML inference, strategy, optimization) but cannot prove correctness without exposing proprietary internals.

STAN requirement:

- Verify that work was executed correctly
- Preserve privacy of internal logic
- Bind payout to proof validity

---

## Layer 1: Verification Layer (Proof of Intelligence)

### Mandatory technical choices

- Run agent logic inside an **S-two-compatible STARK-friendly VM**
- Use **Circle STARKs over M31 field** (`2^31 - 1`)
- Target proof generation on standard servers/laptops with low latency

### On-chain Nexus (Starknet / Cairo 2.x)

- Contract stores **capability root hashes**, not full private data
- Agent submits proof-of-execution tied to registered capability root
- Contract verifies through `verify_proof` syscall path
- Verification result becomes authoritative input for downstream settlement

### Non-negotiable property

Enforce **Computational Integrity**: do not trust claims; verify cryptographic execution evidence.

---

## Layer 2: Trust-Minimized Bitcoin Settlement (VLS)

### Goal

Use Starknet as a programmable covenant/control plane for Bitcoin-side value release.

### Settlement model requirements

- Bitcoin funds locked in a 2-of-2 arrangement (Agent + STAN Escrow/control flow)
- Unlock condition depends on split secret/key material
- One release component is controlled by Starknet logic
- Starknet releases only after valid Nexus proof is confirmed

### Design references

- DLC-inspired contract flows
- Covenant-compatible script paths (including future `OP_CAT` style improvements)

### Non-negotiable property

If proof is invalid or missing, BTC movement is cryptographically blocked.

---

## Layer 3: Privacy Layer (Shielded Intentions)

### Requirements

- Buyer-to-seller job payloads are encrypted with seller public keys
- Public keys are registered in Cairo registry
- Discovery happens over **capability hashes**, not plain strategy identities
- Specific provider identity is hidden until handshake stage

### Threats addressed

- Front-running of high-value intents
- Competitive scraping of agent opportunities

---

## Layer 4: Identity Standard (ERC-8004 + AA)

Treat each agent as a **modular account**, not a plain externally owned address.

### Must-have account features

- Session keys for high-frequency autonomous signatures
- Policy/guard rails via guardians
- Threshold logic (example: >1 BTC requires human or multisig confirmation)

---

## Required Narrative Terms (Judging Language)

Use these exact themes in docs/comments/pitch artifacts:

1. **Quantum-Resistance via STARKs**
2. **Computational Integrity**
3. **Hyper-Scalability**

Guidance:

- Explain that Bitcoin signature assumptions have long-term quantum exposure
- Explain STARK verification layer as quantum-safe proof primitive
- Explain fast proof/verification as enabler for massive agent micro-transaction throughput

---

## Product Positioning

Do not frame STAN as only a bridge or a storefront.

Primary framing:

- **“Central Nervous System of the Agentic Internet.”**

---

## Implementation Priorities (Suggested Build Order)

1. Cairo Nexus registry + capability root registration
2. Proof-verification interface and result state machine
3. Encrypted request handshake and capability-based discovery
4. Agent modular account rules (session keys + guardian checks)
5. Bitcoin settlement adapter design (DLC/covenant execution path)

---

## Engineering Rules for Future Commits

- Prioritize security properties over feature breadth
- Preserve minimal on-chain data exposure
- Keep verification and settlement state transitions explicit and auditable
- Document threat model assumptions in each module
- Every payment-triggering flow must trace back to verified proof state

---

## Open Questions to Resolve With User

- Preferred stack for proving service integration (Rust service vs external prover API)
- First Bitcoin settlement path to implement in prototype (simulated DLC vs testnet script path)
- Registry schema for capability hashes and metadata privacy levels
- Session-key lifecycle and guardian policy defaults

Keep this section updated as answers arrive.

---

## Current Prototype Decisions

- Prototype starts with **Cairo Nexus + local mocks** for end-to-end demo speed.
- Runtime now supports **chain adapters** (Starknet Sepolia + Bitcoin testnet builder) with mock fallbacks.
- Encrypted handshake is implemented as payload encryption between buyer and seller identities.
- This is optimized for hackathon judging narrative and live demo reliability.
