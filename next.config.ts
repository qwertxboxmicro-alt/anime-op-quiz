import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
// Everything the page talks to: iTunes (lookup + preview audio), AniList (posters), Supabase (auth + stats).
const csp = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; dev also needs eval for HMR.
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.mzstatic.com https://s4.anilist.co",
  "connect-src 'self' https://itunes.apple.com https://*.itunes.apple.com https://graphql.anilist.co https://*.supabase.co https://challenges.cloudflare.com" + (dev ? " ws:" : ""),
  "frame-src https://challenges.cloudflare.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
