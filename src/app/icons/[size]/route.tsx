import { ImageResponse } from "next/og";
import { renderAppIcon } from "@/lib/app-icon";

// The Web App Manifest's Android/Chrome icons (ticket #17): src/app/manifest.ts points at these
// two fixed URLs, both "any" and "maskable" purpose. A dynamic segment avoids two near-duplicate
// route files for what's otherwise the exact same drawing (src/lib/app-icon.tsx) at two sizes;
// any size other than the ones the manifest actually references 404s rather than silently
// rendering an arbitrary size nothing links to.
const ICON_SIZES = [192, 512] as const;
type IconSize = (typeof ICON_SIZES)[number];

function isIconSize(value: number): value is IconSize {
  return (ICON_SIZES as readonly number[]).includes(value);
}

export function generateStaticParams() {
  return ICON_SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const parsedSize = Number(size);
  if (!isIconSize(parsedSize)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(renderAppIcon(parsedSize), { width: parsedSize, height: parsedSize });
}
