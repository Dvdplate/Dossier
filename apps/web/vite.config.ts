import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function injectServiceWorkerVersion(buildId: string): Plugin {
  return {
    name: "inject-service-worker-version",
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw.js");
      if (!fs.existsSync(swPath)) return;

      const content = fs.readFileSync(swPath, "utf8");
      const updated = content.replace(
        /const CACHE_VERSION = ["'][^"']*["']/,
        `const CACHE_VERSION = '${buildId}'`
      );
      fs.writeFileSync(swPath, updated);
    },
  };
}

export default defineConfig(({ mode }) => {
  const buildId = Date.now().toString();

  return {
    plugins: [
      react(),
      ...(mode === "production" ? [injectServiceWorkerVersion(buildId)] : []),
    ],
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8787",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
  };
});
