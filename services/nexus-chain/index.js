import { Account, RpcProvider } from "starknet";
import { verifyExecutionProof } from "../prover-mock/index.js";

function asFeltHex(value) {
  if (typeof value !== "string") return `0x${BigInt(value).toString(16)}`;
  if (value.startsWith("0x")) return value;
  return `0x${value}`;
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
      accountAddress && privateKey ? new Account(this.provider, accountAddress, privateKey) : null;
  }

  async registerCapabilityRoot({ capabilityRoot }) {
    if (!this.account) {
      throw new Error("Missing Starknet account credentials for register");
    }

    const tx = await this.account.execute({
      contractAddress: this.contractAddress,
      entrypoint: "register_capability_root",
      calldata: [asFeltHex(capabilityRoot)],
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
        asFeltHex(agentId),
        asFeltHex(proof.proofHash),
        asFeltHex(expectedCapabilityRoot),
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
      calldata: [asFeltHex(proofHash)],
    });
    return result?.result?.[0] === "0x1" || result?.result?.[0] === "1";
  }
}
