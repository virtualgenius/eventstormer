import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { DEV_PORT, PREVIEW_PORT } from "./dev-ports";

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: 'localhost'
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
