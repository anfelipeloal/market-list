import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The service worker script (public/sw.js, ticket #17) must never be served from the browser's
  // own HTTP cache: a stale cached copy would keep an old worker (and its offline behaviour)
  // running long after a deploy changes it. Recommended by the Next.js PWA guide.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
