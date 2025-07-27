import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react()], // Temporarily disable cloudflare plugin
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
  server: {
    port: 3000,
  },
});
