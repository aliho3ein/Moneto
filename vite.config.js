import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Neue Fassungen werden im Hintergrund geholt und beim nächsten
      // Start übernommen – kein Hinweis, kein Knopf.
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon-16.png",
        "favicon-32.png",
        "apple-touch-icon.png"
      ],
      manifest: {
        name: "Moneto – Haushaltsübersicht",
        short_name: "Moneto",
        description: "Eure gemeinsame Haushaltskasse: Ausgaben und Einnahmen an einem Ort.",
        lang: "de",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1B2A4A",
        theme_color: "#f2f5fc",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Alle Routen der App auf index.html zurückführen, damit /items und
        // /settings auch offline laden.
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            // Schrift von Google: einmal geholt, danach aus dem Speicher.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Favicons der Geschäfte – fehlen sie, zeigt der Chip sein
            // eigenes Symbol, deshalb reicht ein kurzer Vorrat.
            urlPattern: /^https:\/\/www\.google\.com\/s2\/favicons/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "shop-favicons",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: {
        // Im Entwicklungsmodus aus, sonst hält der Service Worker alte
        // Stände fest, während man am Code arbeitet.
        enabled: false
      }
    })
  ]
});
