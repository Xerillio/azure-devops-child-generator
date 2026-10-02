import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Each Azure DevOps contribution ("hub"/page) gets its own entry here.
// Add a new key + path if a new contribution is introduced.
const pages = {
  "project-settings": resolve(import.meta.dirname, "src/pages/project-settings/index.tsx"),
  "work-item-menu": resolve(import.meta.dirname, "src/pages/work-item-menu/index.tsx"),
};

// Fixed port so it matches the localhost URI in vss-extension.dev.json.
const DEV_SERVER_PORT = 3000;

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // Self-signed HTTPS cert, required because Azure DevOps only allows
    // iframing extension content served over https, even from localhost.
    command === "serve" && basicSsl(),
  ],
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: pages,
      output: {
        // Fixed (non-hashed) filenames so the static *.html files can
        // reference a stable "./dist/<page>.js" path.
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
