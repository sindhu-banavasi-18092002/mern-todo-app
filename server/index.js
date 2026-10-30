/**
 * Donezo API server — Express + MongoDB.
 *
 * Local dev:  npm run dev   →  http://localhost:5000
 * Vercel:     api/index.js exports `app` as a serverless function.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { MongoMemoryServer } from "mongodb-memory-server";

import { useBundledMongod } from "./config/mongo-binary.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import adminRoutes from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/error.js";

dotenv.config();

// JWT_SECRET must exist before any token is signed.
// A dev fallback keeps local testing working; production requires the real value.
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing JWT_SECRET environment variable.");
  }
  process.env.JWT_SECRET = "dev-only-secret-change-me";
  console.warn("⚠️  JWT_SECRET not set — using a development fallback.");
}

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Behind Vercel's proxy: trust the first hop so rate limiting sees real IPs
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // No origin = same-origin request, curl, or mobile app → allow
      if (!origin) return callback(null, true);
      // Same-origin on Vercel (frontend and API share the domain) → allow
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Basic abuse protection on the API
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Donezo API is running.", docs: "/api/health" });
});

app.use(notFound);
app.use(errorHandler);

// ---- In-memory MongoDB fallback (only when MONGO_URI is not configured) ----
// mongodb-memory-server is imported statically so Vercel's file tracing bundles
// its mongod binary. When a real MONGO_URI exists, it is never started.
async function ensureDatabase() {
  if (process.env.MONGO_URI) return connectDB();
  useBundledMongod();
  const memory = await MongoMemoryServer.create();
  process.env.MONGO_URI = memory.getUri();
  console.log("⚠️  No MONGO_URI — started in-memory MongoDB for this instance.");
  return connectDB();
}

// ---- Local server boot (skipped on Vercel, where api/index.js is the entry) ----
const isServerless = Boolean(process.env.VERCEL);
const PORT = process.env.PORT || 5000;

if (!isServerless && !process.env.TESTING) {
  ensureDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
} else {
  // Connect once per serverless instance (cached promise)
  ensureDatabase().catch((error) => console.error("MongoDB connection failed:", error.message));
}

export default app;
