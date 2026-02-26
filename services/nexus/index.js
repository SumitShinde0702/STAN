import { NexusChain } from "../nexus-chain/index.js";
import { NexusMock } from "../nexus-mock/index.js";

export function createNexusClient(config) {
  if (config.nexusMode === "chain") {
    return new NexusChain(config);
  }
  return new NexusMock();
}
