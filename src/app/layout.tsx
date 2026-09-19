import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mercado",
  description: "La despensa y la lista de compras de la casa.",
  // Names the app on iOS's home screen (ticket #17): Safari reads this specifically when a User
  // adds the app, rather than the Web App Manifest's own name (see manifest.ts and apple-icon.tsx).
  appleWebApp: {
    title: "Mercado",
  },
};

// Tints the browser/OS chrome -- the standalone app's status bar included, once installed -- to
// match the app rather than a default white or black (ticket #17). Kept in sync with manifest.ts's
// theme_color, which is the same value for the same reason (globals.css's --primary).
//
// viewportFit: "cover" (UI redesign, no ticket) lets the page extend under the iOS home-indicator
// area instead of Safari reserving a plain white bar for it: without this, env(safe-area-inset-bottom)
// resolves to 0 on iOS regardless of the device, and BottomNav's own bottom padding (see
// bottom-nav.tsx and globals.css's --bottom-nav-offset) would never actually clear the home
// indicator on a notched/gestural iPhone.
export const viewport: Viewport = {
  themeColor: "#171717",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
