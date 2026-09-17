import { ImageResponse } from "next/og";
import { renderAppIcon } from "@/lib/app-icon";

// iOS's own home-screen icon convention (ticket #17): Safari reads this specifically to name and
// icon the app when added to the home screen, not the Web App Manifest's `icons` list (see
// src/app/manifest.ts and the app-icons metadata docs). 180x180 is Apple's current universal
// size, large enough for every iPhone's Retina home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(renderAppIcon(180), size);
}
