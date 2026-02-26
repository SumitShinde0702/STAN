import { BitcoinSettlementService } from "../settlement-btc/index.js";
import { SettlementSimulator } from "../settlement-sim/index.js";

export function createSettlementClient(config) {
  if (config.btcMode === "btc") {
    return new BitcoinSettlementService(config);
  }
  return new SettlementSimulator();
}
