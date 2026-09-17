import type { MetadataRoute } from "next";

// Makes Mercado installable to a phone's home screen (ticket #17): Chrome/Android read this
// manifest directly for the install prompt and icons, and modern Safari/iOS increasingly does too
// (see apple-icon.tsx for iOS's own, older-but-still-needed icon convention, which this manifest
// doesn't replace). Next.js serves this at /manifest.webmanifest and links it from every page's
// <head> automatically -- see the manifest file-convention docs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mercado",
    short_name: "Mercado",
    description: "La despensa y la lista de compras de la casa.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    // Matches globals.css: --background (the light theme's page background) and --primary (the
    // app's highest-contrast surface, used for its own buttons and now its icon -- see
    // src/lib/app-icon.tsx) rather than colours invented for this manifest.
    background_color: "#ffffff",
    theme_color: "#171717",
    // Both "any" and "maskable" entries per size: Android crops a "maskable" icon to its own
    // launcher shape, while a plain "any" icon is shown as-is by launchers that don't support
    // masking. Both point at the same generated image (src/app/icons/[size]/route.tsx), whose
    // glyph is already kept inside the maskable-safe zone (see src/lib/app-icon.tsx).
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
