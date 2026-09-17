import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The service worker script (public/sw.js, ticket #17) must never be served from the browser's
  // own HTTP cache: a stale cached copy would keep an old worker (and its offline behaviour)
  // running long after a deploy changes it. Matches the Next.js PWA guide's own recommendation
  // (code review, ticket #17: the initial no-cache alone still permits a conditional revalidation
  // response; no-store rules that out too).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
