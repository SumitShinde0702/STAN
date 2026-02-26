import crypto from "node:crypto";
import { getConfig } from "../../config/index.js";
import { createNexusClient } from "../../services/nexus/index.js";
import { ProverAdapter } from "../../services/prover-adapter/index.js";

function hashHex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function main() {
  const config = getConfig();
  if (config.nexusMode !== "chain") {
    throw new Error("Set STAN_NEXUS_MODE=chain before running this script");
  }

  const agentId = config.starknet.sellerAgentAddress || config.starknet.accountAddress;
  if (!agentId) {
    throw new Error("Missing STARKNET_SELLER_AGENT_ADDRESS or STARKNET_ACCOUNT_ADDRESS");
  }

  const capabilityRoot = process.env.STAN_CAPABILITY_ROOT || hashHex("seller-strategy-v1-private-circuit");
  const prover = new ProverAdapter(config);
  const proof = await prover.generate({
    capabilityRoot,
    inputCommitment: hashHex(process.env.STAN_INPUT_COMMITMENT || "sample-input"),
    outputCommitment: hashHex(process.env.STAN_OUTPUT_COMMITMENT || "sample-output"),
  });

  const valid = await prover.verify(proof);
  if (!valid) throw new Error("Generated proof did not pass verifier");

  const nexus = createNexusClient(config);
  const verification = await nexus.submitExecutionProof({
    agentId,
    expectedCapabilityRoot: capabilityRoot,
    proof,
  });
  const status = await nexus.isProofVerified(proof.proofHash);

  console.log("Proof submitted:");
  console.log(JSON.stringify(verification, null, 2));
  console.log(`\nProof status on Nexus: ${status ? "VERIFIED" : "NOT_VERIFIED"}`);
}

main().catch((error) => {
  console.error(`submit-proof failed: ${error.message}`);
  process.exit(1);
});
