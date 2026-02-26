import crypto from "node:crypto";

function keypairFromPrivateKeyHex(privateKeyHex) {
  const ecdh = crypto.createECDH("secp256k1");
  ecdh.setPrivateKey(Buffer.from(privateKeyHex, "hex"));
  return {
    publicKeyHex: ecdh.getPublicKey("hex", "compressed"),
    privateKeyHex,
  };
}

export function createAgentIdentity(label) {
  const privateKeyHex = crypto.randomBytes(32).toString("hex");
  const pair = keypairFromPrivateKeyHex(privateKeyHex);
  return {
    label,
    publicKeyHex: pair.publicKeyHex,
    privateKeyHex: pair.privateKeyHex,
  };
}

function deriveSharedKey(senderPrivateKeyHex, recipientPublicKeyHex) {
  const ecdh = crypto.createECDH("secp256k1");
  ecdh.setPrivateKey(Buffer.from(senderPrivateKeyHex, "hex"));
  const secret = ecdh.computeSecret(Buffer.from(recipientPublicKeyHex, "hex"));
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptForSeller({ buyerPrivateKeyHex, sellerPublicKeyHex, payload }) {
  const key = deriveSharedKey(buyerPrivateKeyHex, sellerPublicKeyHex);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptBuyerRequest({ sellerPrivateKeyHex, buyerPublicKeyHex, envelope }) {
  const key = deriveSharedKey(sellerPrivateKeyHex, buyerPublicKeyHex);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "hex"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
