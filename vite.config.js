import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Change these two lines when you rename the app
const APP_NAME = "DueSora";
const APP_SHORT_NAME = "DueSora"; // shown under the icon on the phone, keep it short

// Vite only treats .jsx files as JSX by default.
// Because this project keeps components in plain .js files,
// we tell Vite (and its dependency scanner) to read .js files as JSX too.
export default defineConfig({
  plugins: [
    react({ include: /\.(js|jsx)$/ }),
    VitePWA({
      registerType: "autoUpdate", // new versions install themselves
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "logo.png",
      ],
      manifest: {
        name: `${APP_NAME} - invoices and receipts`,
        short_name: APP_SHORT_NAME,
        description: "Create invoices and receipts, and track payments.",
        theme_color: "#0c5adb",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
});
