import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // iOS PWA constraint (see project docs): display must be standalone
      // for the app to install cleanly to the Home Screen without browser chrome.
      manifest: {
        name: "Aduke's Town",
        short_name: "Aduke's Town",
        description: "A cozy match-3 puzzle game.",
        theme_color: "#ff8fb3",
        background_color: "#1a1a2e",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
