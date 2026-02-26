import { RpcProvider } from "starknet";
import { getConfig } from "../../config/index.js";

function required(name, value) {
  return {
    name,
    ok: Boolean(value),
    value: value ? "set" : "missing",
  };
}

async function main() {
  const config = getConfig();

  const checks = [
    required("STARKNET_RPC_URL", config.starknet.rpcUrl),
    required("STARKNET_NEXUS_CONTRACT_ADDRESS", config.starknet.contractAddress),
    required("STARKNET_ACCOUNT_ADDRESS", config.starknet.accountAddress),
    required("STARKNET_PRIVATE_KEY", config.starknet.privateKey),
  ];

  console.log("STAN Starknet Doctor\n");
  for (const check of checks) {
    console.log(`- ${check.name}: ${check.value}`);
  }

  if (!config.starknet.rpcUrl) {
    console.log("\nRPC check skipped (missing STARKNET_RPC_URL).");
    process.exit(1);
  }

  try {
    const provider = new RpcProvider({ nodeUrl: config.starknet.rpcUrl });
    const block = await provider.getBlock("latest");
    console.log("\nRPC OK:");
    console.log(`- latest block number: ${block.block_number}`);
    console.log(`- latest block hash: ${block.block_hash}`);
  } catch (error) {
    console.log("\nRPC FAILED:");
    console.log(`- ${error.message}`);
    process.exit(1);
  }

  const missingCritical = checks.some((c) => !c.ok);
  if (missingCritical) {
    console.log("\nFill missing env vars to run on-chain transactions.");
    process.exit(1);
  }

  console.log("\nReady for on-chain register/proof transactions.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
