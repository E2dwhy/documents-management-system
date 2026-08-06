import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disabled in dev by default (see reloadOnOnline) — service workers
  // caching stale chunks during `next dev` is a common source of
  // confusing bugs. Test PWA/offline behavior against `next build && next start`.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
