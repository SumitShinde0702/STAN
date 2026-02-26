import fs from "node:fs";
import path from "node:path";
import { Account, RpcProvider } from "starknet";
import { getConfig } from "../../config/index.js";

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing artifact: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  const config = getConfig();
  const { rpcUrl, accountAddress, privateKey } = config.starknet;
  if (!rpcUrl || !accountAddress || !privateKey) {
    throw new Error("Missing STARKNET_RPC_URL / STARKNET_ACCOUNT_ADDRESS / STARKNET_PRIVATE_KEY");
  }

  const sierraPath = path.resolve("contracts/artifacts/nexus.contract_class.json");
  const casmPath = path.resolve("contracts/artifacts/nexus.compiled_contract_class.json");
  const sierra = readJson(sierraPath);
  const casm = readJson(casmPath);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account(provider, accountAddress, privateKey);

  const result = await account.declareAndDeploy({
    contract: sierra,
    casm,
    constructorCalldata: [],
  });

  console.log("Nexus contract deployed:");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nSet STARKNET_NEXUS_CONTRACT_ADDRESS=${result.deploy.contract_address}`);
}

main().catch((error) => {
  console.error(`deploy-nexus failed: ${error.message}`);
  console.error(
    "Tip: compile Cairo contract first and place artifacts at contracts/artifacts/nexus.contract_class.json and contracts/artifacts/nexus.compiled_contract_class.json",
  );
  process.exit(1);
});
