import mongoose from "mongoose";
import os from "node:os";
import path from "node:path";

let memoryServer = null;
let connectPromise = null;

/**
 * Connects to MongoDB once and reuses the connection.
 *
 * - Uses MONGO_URI when it is set (MongoDB Atlas, or a local mongod).
 * - Otherwise starts an in-memory MongoDB so the app runs with zero setup.
 *   In-memory data is lost when the process restarts — use Atlas for real data.
 */
export function connectDB() {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    mongoose.set("strictQuery", true);

    let uri = process.env.MONGO_URI;

    if (!uri) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      // Cache the downloaded mongod binary in the user's home, not the project
      if (!process.env.MONGOMS_DOWNLOAD_DIR) {
        process.env.MONGOMS_DOWNLOAD_DIR = path.join(os.homedir(), ".cache", "mongodb-binaries");
      }
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log("⚠️  No MONGO_URI set — using in-memory MongoDB (data resets on restart).");
      console.log("   Add MONGO_URI to server/.env for persistent storage.");
    }

    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected (${mongoose.connection.name})`);
    return uri;
  })();

  return connectPromise;
}

export async function disconnectDB() {
  connectPromise = null;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
