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

function resolveArtifacts() {
  const explicitSierra = path.resolve("contracts/artifacts/nexus.contract_class.json");
  const explicitCasm = path.resolve("contracts/artifacts/nexus.compiled_contract_class.json");
  if (fs.existsSync(explicitSierra) && fs.existsSync(explicitCasm)) {
    return { sierraPath: explicitSierra, casmPath: explicitCasm };
  }

  const targetDir = path.resolve("target/dev");
  if (!fs.existsSync(targetDir)) {
    throw new Error(
      "Missing contract artifacts. Run `scarb build` and `node scripts/starknet/prepare-artifacts.js` first.",
    );
  }

  const files = fs.readdirSync(targetDir).map((name) => path.join(targetDir, name));
  const sierraPath = files.find((p) => p.endsWith(".contract_class.json"));
  const casmPath = files.find((p) => p.endsWith(".compiled_contract_class.json"));
  if (!sierraPath || !casmPath) {
    throw new Error("No Sierra/CASM artifacts found in target/dev.");
  }
  return { sierraPath, casmPath };
}

async function main() {
  const config = getConfig();
  const { rpcUrl, accountAddress, privateKey } = config.starknet;
  if (!rpcUrl || !accountAddress || !privateKey) {
    throw new Error("Missing STARKNET_RPC_URL / STARKNET_ACCOUNT_ADDRESS / STARKNET_PRIVATE_KEY");
  }

  const { sierraPath, casmPath } = resolveArtifacts();
  const sierra = readJson(sierraPath);
  const casm = readJson(casmPath);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account({
    provider,
    address: accountAddress,
    signer: privateKey,
    cairoVersion: "1",
  });

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
  if (error?.stack) {
    console.error(error.stack);
  }
  const message = `${error?.message ?? ""} ${error?.stack ?? ""}`;
  if (message.includes("exceed balance (0)")) {
    console.error(
      "Your Starknet account has zero balance. Fund it from https://faucet.starknet.io/ and retry deploy.",
    );
  }
  console.error(
    "Tip: compile Cairo contract first and place artifacts at contracts/artifacts/nexus.contract_class.json and contracts/artifacts/nexus.compiled_contract_class.json",
  );
  process.exit(1);
});
