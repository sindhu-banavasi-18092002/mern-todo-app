/**
 * Locates the mongod executable bundled with the deployed function.
 * Runs BEFORE mongodb-memory-server is imported, because the library caches
 * its binary path on first use.
 */
import fs from "node:fs";
import path from "node:path";

export function useBundledMongod() {
  if (!process.env.VERCEL || process.env.MONGOMS_SYSTEM_BINARY) return;

  const candidates = [
    path.join(process.cwd(), "mongod"),
    path.join(process.cwd(), "server", "mongod"),
    "/var/task/server/mongod",
    "/var/task/mongod",
  ];

  const found = candidates.find((file) => {
    try {
      return fs.existsSync(file) && fs.statSync(file).size > 1024;
    } catch {
      return false;
    }
  });

  if (found) {
    process.env.MONGOMS_SYSTEM_BINARY = found;
    console.log("🔧 Using bundled mongod:", found);
  } else {
    console.warn("⚠️  Bundled mongod not found. cwd:", process.cwd(), "candidates:", candidates.join(", "));
  }
}
