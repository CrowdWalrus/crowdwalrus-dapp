import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
      "node:buffer": "buffer",
      buffer: "buffer/",
    },
  },
  optimizeDeps: {
    // Include dependencies that cause optimization issues (nested deps need > syntax)
    include: [
      "@mysten/dapp-kit",
      "@tanstack/react-query",
      "react",
      "react-dom",
      "react-router-dom",
      "poseidon-lite",
    ],
    // Exclude WASM modules only
    exclude: ["@mysten/walrus-wasm"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "img-src 'self' data: blob: https://aggregator.walrus-mainnet.walrus.space https://aggregator.walrus-testnet.walrus.space https://aggregator.walrus.space https://aggregator.walrus.site https://aggregator-mainnet.walrus.space https://aggregator.mainnet.walrus.space https://aggregator.walrus-testnet.walrus.site;",
    },
  },
});
