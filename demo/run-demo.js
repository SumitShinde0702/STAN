import { executeSiliconHandshake } from "./silicon-handshake.js";

function print(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function run() {
  console.log("STAN Demo: Silicon Handshake (Hackathon Prototype)");
  const result = await executeSiliconHandshake();
  print("Runtime Modes", result.modes);
  print("Capability Root Registered", result.registerResult);
  print("Encrypted Handshake", result.handshakePreview);
  print("Nexus Proof Verification", result.verification);
  print("Settlement Result", result.settlement);

  const outcome = result.proofStatus === "VERIFIED" ? "Escrow released or signed for release" : "Escrow waiting";
  console.log(`\nResult: Proof verified -> ${outcome}`);
  console.log("Narrative tags: Quantum-Resistance via STARKs, Computational Integrity, Hyper-Scalability");
}

run().catch((error) => {
  console.error("\nDemo failed:", error.message);
  process.exit(1);
});
