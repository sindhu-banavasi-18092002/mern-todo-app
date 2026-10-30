import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev: the frontend proxies /api to the Express server on port 5000.
// Production on Vercel: /api is routed to the serverless function (see vercel.json).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
