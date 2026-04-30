import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.VERCEL
  ? path.resolve(__dirname, "dist")
  : path.resolve(__dirname, "../server/dist");

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir,
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
