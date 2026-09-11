import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Without this, a port already in use makes Vite quietly move to 5174 — an
    // origin the backend's CORS allow-list doesn't include, so the app loads but
    // every API call fails. Failing loudly on startup is far easier to diagnose.
    strictPort: true,
    open: true,
  },
});
