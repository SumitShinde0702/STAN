import crypto from "node:crypto";
import { getConfig } from "../../config/index.js";
import { createNexusClient } from "../../services/nexus/index.js";

function hashHex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function main() {
  const config = getConfig();
  if (config.nexusMode !== "chain") {
    throw new Error("Set STAN_NEXUS_MODE=chain before running this script");
  }

  const sellerAgentId = config.starknet.sellerAgentAddress || config.starknet.accountAddress;
  if (!sellerAgentId) {
    throw new Error("Missing STARKNET_SELLER_AGENT_ADDRESS or STARKNET_ACCOUNT_ADDRESS");
  }

  const capabilityRoot = process.env.STAN_CAPABILITY_ROOT || hashHex("seller-strategy-v1-private-circuit");
  const nexus = createNexusClient(config);
  const result = await nexus.registerCapabilityRoot({ agentId: sellerAgentId, capabilityRoot });

  console.log("Capability root registered:");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nUse this capability root for proof flow: ${capabilityRoot}`);
}

main().catch((error) => {
  console.error(`register-capability failed: ${error.message}`);
  process.exit(1);
});
