import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const wranglerDir = resolve(root, ".output/server");
const devVarsPath = resolve(wranglerDir, ".dev.vars");

if (!existsSync(envPath)) {
  console.warn(
    "[sync-dev-vars] No .env file found. Copy .env.example to .env and set your secrets.",
  );
  process.exit(0);
}

const lines = readFileSync(envPath, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith("#"));

if (lines.length === 0) {
  console.warn("[sync-dev-vars] .env is empty — nothing to sync.");
  process.exit(0);
}

mkdirSync(wranglerDir, { recursive: true });
writeFileSync(devVarsPath, `${lines.join("\n")}\n`, "utf8");

console.log(
  `[sync-dev-vars] Wrote ${lines.length} variable(s) to .output/server/.dev.vars`,
);
