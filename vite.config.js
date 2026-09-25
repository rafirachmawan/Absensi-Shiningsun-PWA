import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],

      devOptions: {
        enabled: true, // WAJIB agar PWA aktif saat development
      },

      manifest: {
        id: "/",
        name: "ShiningSun Absensi",
        short_name: "ShiningSun",
        description: "Presensi & Kehadiran Digital Guru Shiningsun",
        lang: "id",
        dir: "ltr",

        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",

        background_color: "#FAF6EF",
        theme_color: "#1c1917",

        categories: ["business", "productivity", "education"],

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});


