import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/**
 * Next.js metadata route — served at /manifest.webmanifest.
 * Makes the app installable as a PWA on Android/desktop Chrome and,
 * combined with the apple-touch-icon meta tags in `layout.tsx`, on iOS.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appConfig.orgName} — Suivi de Dossiers QR`,
    short_name: "Suivi Dossiers",
    description:
      "Suivi de la circulation des dossiers par scan de QR code, avec fonctionnement hors ligne.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "fr-FR",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
