// Vercel serverless entry point.
// Loads the Express app from server/index.js at runtime (the file is bundled by
// vercel.json → functions.includeFiles). Dynamic import keeps the ESM app working
// inside the CommonJS function wrapper Vercel generates.
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import("../server/index.js").then((mod) => mod.default);
  }
  return appPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("Serverless bootstrap failed:", error);
    res.status(500).json({ message: "Server failed to start.", detail: String(error?.message || error) });
  }
}
