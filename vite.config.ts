import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Phaser alone minifies to ~1.3MB; the default 500kB warning threshold
    // fires on every build regardless of our own code size.
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-48.png", "apple-touch-icon.png"],
      // iOS PWA constraint (see project docs): display must be standalone
      // for the app to install cleanly to the Home Screen without browser chrome.
      manifest: {
        name: "Aduke's Town",
        short_name: "Aduke's Town",
        description: "A cozy match-3 puzzle game.",
        theme_color: "#ff8fb3",
        background_color: "#1a1a2e",
        display: "standalone",
        // Landscape-first: the town + match-3 board both want the wider
        // axis. A CSS rotate hint (styles.css) covers the case where the
        // OS ignores this and leaves the PWA in portrait (iOS often does).
        orientation: "landscape",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
