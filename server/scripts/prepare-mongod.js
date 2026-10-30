/**
 * Vercel build step: make sure a mongod binary is present for the in-memory
 * database fallback (used only when MONGO_URI is not configured).
 * Never fails the build — a missing binary only disables the fallback.
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs";
import path from "node:path";

async function main() {
  let server;
  try {
    server = await MongoMemoryServer.create();
    const proc = server.instanceInfo?.instance?.mongodProcess;
    const binary = proc?.spawnfile;

    console.log("mongod binary:", binary);

    if (binary && fs.existsSync(binary)) {
      const target = path.join(process.cwd(), "mongod");
      fs.copyFileSync(binary, target);
      try {
        fs.chmodSync(target, 0o755);
      } catch {}
      console.log(`✅ mongod copied to ${target} (${Math.round(fs.statSync(target).size / 1048576)} MB)`);
      return;
    }

    const cacheRoot = process.env.MONGOMS_DOWNLOAD_DIR || path.join(process.cwd(), "node_modules", ".cache");
    const found = findBinary(cacheRoot);
    console.log("cache search root:", cacheRoot, "found:", found);
    if (found) {
      const target = path.join(process.cwd(), "mongod");
      fs.copyFileSync(found, target);
      try {
        fs.chmodSync(target, 0o755);
      } catch {}
      console.log(`✅ mongod copied from cache to ${target}`);
      return;
    }

    console.warn("⚠️  No mongod binary found — deployed API will need MONGO_URI.");
  } catch (error) {
    console.warn("⚠️  prepare-mongod skipped:", error.message);
  } finally {
    if (server) await server.stop().catch(() => {});
  }
}

function findBinary(dir, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findBinary(full, depth + 1);
      if (nested) return nested;
    } else if (entry.name.startsWith("mongod")) {
      return full;
    }
  }
  return null;
}

main().then(() => process.exit(0));
