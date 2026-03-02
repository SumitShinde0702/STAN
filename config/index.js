import dotenv from "dotenv";

dotenv.config({ quiet: true, override: true });

export function getConfig() {
  return {
    nexusMode: process.env.STAN_NEXUS_MODE ?? "mock", // mock | chain
    btcMode: process.env.STAN_BTC_MODE ?? "sim", // sim | btc
    proverMode: process.env.STAN_PROVER_MODE ?? "mock", // mock | http
    starknet: {
      rpcUrl: process.env.STARKNET_RPC_URL ?? "",
      contractAddress: process.env.STARKNET_NEXUS_CONTRACT_ADDRESS ?? "",
      accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS ?? "",
      privateKey: process.env.STARKNET_PRIVATE_KEY ?? "",
      sellerAgentAddress:
        process.env.STARKNET_SELLER_AGENT_ADDRESS ?? process.env.STARKNET_ACCOUNT_ADDRESS ?? "",
    },
    prover: {
      apiBaseUrl: process.env.STAN_PROVER_API_BASE_URL ?? "",
      apiKey: process.env.STAN_PROVER_API_KEY ?? "",
    },
    bitcoin: {
      network: process.env.BTC_NETWORK ?? "testnet", // testnet | regtest
      destinationAddress: process.env.BTC_DESTINATION_ADDRESS ?? "",
      buyerWif: process.env.BTC_BUYER_WIF ?? "",
      sellerWif: process.env.BTC_SELLER_WIF ?? "",
      fundingTxid: process.env.BTC_FUNDING_TXID ?? "",
      fundingVout: process.env.BTC_FUNDING_VOUT ?? "",
      fundingValueSats: process.env.BTC_FUNDING_VALUE_SATS ?? "",
      feeSats: Number.parseInt(process.env.BTC_FEE_SATS ?? "1500", 10),
      broadcastUrl:
        process.env.BTC_BROADCAST_URL ??
        (process.env.BTC_NETWORK === "regtest"
          ? "http://127.0.0.1:30000/tx"
          : "https://mempool.space/testnet/api/tx"),
    },
  };
}
