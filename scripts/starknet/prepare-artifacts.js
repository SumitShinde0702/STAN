import fs from "node:fs";
import path from "node:path";

const targetDir = path.resolve("target/dev");
const outDir = path.resolve("contracts/artifacts");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pickArtifacts(files) {
  const sierra = files.find((f) => f.endsWith(".contract_class.json"));
  const casm = files.find((f) => f.endsWith(".compiled_contract_class.json"));
  return { sierra, casm };
}

function main() {
  if (!fs.existsSync(targetDir)) {
    throw new Error("target/dev not found. Run `scarb build` first.");
  }

  const files = fs
    .readdirSync(targetDir)
    .map((name) => path.join(targetDir, name))
    .filter((p) => fs.statSync(p).isFile())
    .map((p) => p.replaceAll("\\", "/"));

  const { sierra, casm } = pickArtifacts(files);
  if (!sierra || !casm) {
    throw new Error("Could not locate contract artifacts in target/dev.");
  }

  ensureDir(outDir);
  const outSierra = path.join(outDir, "nexus.contract_class.json");
  const outCasm = path.join(outDir, "nexus.compiled_contract_class.json");
  fs.copyFileSync(sierra, outSierra);
  fs.copyFileSync(casm, outCasm);

  console.log("Artifacts prepared:");
  console.log(`- ${sierra} -> ${outSierra}`);
  console.log(`- ${casm} -> ${outCasm}`);
}

try {
  main();
} catch (error) {
  console.error(`prepare-artifacts failed: ${error.message}`);
  process.exit(1);
}
