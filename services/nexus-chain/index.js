import { Account, RpcProvider } from "starknet";
import { verifyExecutionProof } from "../prover-mock/index.js";

// Starknet field prime for felt252 normalization.
const FELT_PRIME =
  (2n ** 251n) + (17n * (2n ** 192n)) + 1n;

function stripHexPrefix(value) {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function toFeltHex(value) {
  if (typeof value === "bigint") {
    const normalized = ((value % FELT_PRIME) + FELT_PRIME) % FELT_PRIME;
    return `0x${normalized.toString(16)}`;
  }

  if (typeof value === "number") {
    return toFeltHex(BigInt(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "0x0";
    if (/^[0-9]+$/.test(trimmed)) return toFeltHex(BigInt(trimmed));
    if (/^(0x)?[0-9a-fA-F]+$/.test(trimmed)) {
      return toFeltHex(BigInt(`0x${stripHexPrefix(trimmed)}`));
    }
  }

  throw new Error(`Cannot convert value to felt: ${String(value)}`);
}

export class NexusChain {
  constructor(config) {
    const { rpcUrl, contractAddress, accountAddress, privateKey } = config.starknet;
    if (!rpcUrl || !contractAddress) {
      throw new Error("Missing Starknet RPC URL or Nexus contract address");
    }

    this.contractAddress = contractAddress;
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    this.account =
      accountAddress && privateKey
        ? new Account({
            provider: this.provider,
            address: accountAddress,
            signer: privateKey,
            cairoVersion: "1",
          })
        : null;
  }

  async registerCapabilityRoot({ capabilityRoot }) {
    if (!this.account) {
      throw new Error("Missing Starknet account credentials for register");
    }

    const tx = await this.account.execute({
      contractAddress: this.contractAddress,
      entrypoint: "register_capability_root",
      calldata: [toFeltHex(capabilityRoot)],
    });
    await this.provider.waitForTransaction(tx.transaction_hash);

    return {
      txHash: tx.transaction_hash,
      capabilityRoot,
      agentId: this.account.address,
    };
  }

  async submitExecutionProof({ agentId, expectedCapabilityRoot, proof }) {
    if (!verifyExecutionProof(proof)) {
      throw new Error("Proof payload failed local validation");
    }
    if (!this.account) {
      throw new Error("Missing Starknet account credentials for proof submission");
    }

    const tx = await this.account.execute({
      contractAddress: this.contractAddress,
      entrypoint: "submit_execution_proof",
      calldata: [
        toFeltHex(agentId),
        toFeltHex(proof.proofHash),
        toFeltHex(expectedCapabilityRoot),
      ],
    });
    await this.provider.waitForTransaction(tx.transaction_hash);

    return {
      txHash: tx.transaction_hash,
      agentId,
      capabilityRoot: expectedCapabilityRoot,
      proofHash: proof.proofHash,
      computationalIntegrity: true,
    };
  }

  async isProofVerified(proofHash) {
    const result = await this.provider.callContract({
      contractAddress: this.contractAddress,
      entrypoint: "is_proof_verified",
      calldata: [toFeltHex(proofHash)],
    });
    const raw = Array.isArray(result)
      ? result[0]
      : Array.isArray(result?.result)
        ? result.result[0]
        : result?.result?.[0];

    if (raw === true || raw === false) return raw;
    if (typeof raw === "bigint") return raw === 1n;
    if (typeof raw === "number") return raw === 1;
    if (typeof raw === "string") return raw === "0x1" || raw === "1";
    return false;
  }
}
