import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react()],
  server: {
    port: 4242,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Remove noisy logs in production bundles while keeping them for local dev
    pure:
      mode === "production"
        ? ["console.log", "console.info", "console.debug"]
        : [],
  },
}));
