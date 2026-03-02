import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);

const ECPair = ECPairFactory(ecc);

function getNetwork(name) {
  if (name === "regtest") return bitcoin.networks.regtest;
  return bitcoin.networks.testnet;
}

function asNumber(value, fallback = 0) {
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBigInt(value, fallback = 0n) {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(Math.trunc(value));
    const normalized = `${value}`.trim();
    if (!normalized) return fallback;
    return BigInt(normalized);
  } catch {
    return fallback;
  }
}

export class BitcoinSettlementService {
  constructor(config) {
    this.networkName = config.bitcoin.network;
    this.network = getNetwork(this.networkName);
    this.escrows = new Map();
    this.defaultFeeSats = config.bitcoin.feeSats;
    this.broadcastUrl = config.bitcoin.broadcastUrl;
  }

  createEscrow({ escrowId, satoshis, buyerPubkeyHex, sellerPubkeyHex, proofHash }) {
    const buyerPubkey = Buffer.from(buyerPubkeyHex, "hex");
    const sellerPubkey = Buffer.from(sellerPubkeyHex, "hex");

    const multisig = bitcoin.payments.p2ms({
      m: 2,
      pubkeys: [buyerPubkey, sellerPubkey],
      network: this.network,
    });
    const script = bitcoin.payments.p2wsh({ redeem: multisig, network: this.network });

    const escrow = {
      escrowId,
      satoshis,
      proofHash,
      network: this.networkName,
      p2wshAddress: script.address,
      witnessScriptHex: Buffer.from(multisig.output).toString("hex"),
      state: "AWAITING_FUNDS",
      createdAt: new Date().toISOString(),
      releasedAt: null,
      releaseTxHex: null,
    };

    this.escrows.set(escrowId, escrow);
    return escrow;
  }

  releaseEscrow({
    escrowId,
    isProofVerified,
    destinationAddress,
    fundingTxid,
    fundingVout,
    fundingValueSats,
    buyerWif,
    sellerWif,
    feeSats,
  }) {
    if (!isProofVerified) throw new Error("Proof not verified by Nexus");

    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error(`Escrow not found: ${escrowId}`);

    const hasUtxoData = fundingTxid && `${fundingVout}` !== "" && fundingValueSats;
    const hasKeys = buyerWif && sellerWif && destinationAddress;
    if (!hasUtxoData || !hasKeys) {
      return {
        ...escrow,
        state: "READY_TO_RELEASE",
        releaseHint:
          "Provide funding UTXO + buyer/seller WIF + destination address to build and sign testnet transaction.",
      };
    }

    const buyerPair = ECPair.fromWIF(buyerWif, this.network);
    const sellerPair = ECPair.fromWIF(sellerWif, this.network);
    const witnessScript = Buffer.from(escrow.witnessScriptHex, "hex");
    const spendFee = asBigInt(feeSats, BigInt(this.defaultFeeSats));
    const inputValue = asBigInt(fundingValueSats, 0n);
    const outputValue = inputValue - spendFee;

    if (outputValue <= 0n) {
      throw new Error("Funding value must be greater than fee");
    }

    const psbt = new bitcoin.Psbt({ network: this.network });
    psbt.addInput({
      hash: fundingTxid,
      index: asNumber(fundingVout),
      witnessUtxo: {
        script: bitcoin.payments.p2wsh({ redeem: { output: witnessScript }, network: this.network })
          .output,
        value: inputValue,
      },
      witnessScript,
    });
    psbt.addOutput({
      address: destinationAddress,
      value: outputValue,
    });

    psbt.signInput(0, buyerPair);
    psbt.signInput(0, sellerPair);
    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();

    const released = {
      ...escrow,
      state: "SIGNED_TX_READY",
      releasedAt: new Date().toISOString(),
      releaseTxHex: txHex,
      releaseTxId: null,
    };
    this.escrows.set(escrowId, released);
    return released;
  }

  async broadcastSignedTransaction({ escrowId, txHex }) {
    const escrow = this.escrows.get(escrowId);
    if (!txHex) {
      throw new Error("Missing signed tx hex for broadcast");
    }
    if (!this.broadcastUrl) {
      throw new Error("Missing BTC broadcast URL");
    }

    const response = await fetch(this.broadcastUrl, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: txHex,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`BTC broadcast failed (${response.status}): ${body}`);
    }

    const txid = body.trim().replace(/^"|"$/g, "");
    const explorerBase =
      this.networkName === "regtest" ? null : "https://mempool.space/testnet/tx";
    const update = {
      ...(escrow || {}),
      state: "BROADCASTED",
      releaseTxId: txid,
      releaseTxUrl: explorerBase ? `${explorerBase}/${txid}` : null,
    };
    this.escrows.set(escrowId, update);
    return update;
  }
}
