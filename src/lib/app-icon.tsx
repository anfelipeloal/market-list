import type { ReactElement } from "react";

// Shared drawing for every generated app icon (ticket #17, installing as "Mercado"): a single
// glyph -- Mercado's own initial -- centered on the app's primary colour, used identically by
// src/app/apple-icon.tsx (iOS's home-screen icon) and src/app/icons/[size]/route.tsx (the Web App
// Manifest's Android/Chrome icons). One shared element keeps every generated icon visually
// identical regardless of where, or at what size, it's rendered.
//
// The glyph sits well inside the square (roughly its middle 55%) rather than filling it edge to
// edge: Android crops a "maskable" icon to different shapes (circle, squircle, rounded square,
// ...), cutting up to roughly 20% off every side, and content outside that safe zone can be
// clipped. The *background* still fills the square completely (no transparency, no padding), so
// the icon looks intentional whatever shape it ends up cropped to.

// Matches globals.css: --primary / --primary-foreground, the same near-black-on-white pairing the
// rest of the UI uses for its highest-contrast surface (buttons, "Terminar compra") -- not a
// colour invented for this icon.
export const APP_ICON_BACKGROUND = "#171717";
export const APP_ICON_FOREGROUND = "#fafafa";

export function renderAppIcon(size: number): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: APP_ICON_BACKGROUND,
        color: APP_ICON_FOREGROUND,
        fontSize: Math.round(size * 0.55),
        fontWeight: 700,
      }}
    >
      M
    </div>
  );
}
