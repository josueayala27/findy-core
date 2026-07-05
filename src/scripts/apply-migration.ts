// @ts-nocheck
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env automatically if present (Node v20.6+)
const envPath = join(__dirname, "..", "..", "..", ".env");
try {
  process.loadEnvFile(envPath);
} catch {
  // .env loader unavailable or file missing — fall back to existing env
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(DATABASE_URL);

async function main() {
  const migrationPath = join(__dirname, "..", "db", "migrations", "0001_place_reviews.sql");
  const migration = await readFile(migrationPath, "utf-8");
  await sql.query(migration);
  console.log("Migration applied: place_reviews");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
