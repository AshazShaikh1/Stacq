import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (resource thumbnails, user avatars)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Unsplash fallback images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Open Graph / link previews (generic external images)
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ─── PostHog reverse proxy ────────────────────────────────────────────────
  // Routes PostHog traffic through stacq.in/ingest/* so ad blockers
  // (uBlock, Brave, etc.) cannot block it — they only block posthog.com directly.
  // Official guide: https://posthog.com/docs/advanced/proxy/nextjs
  async rewrites() {
    return [
      {
        // JS bundle — loaded once on first visit
        source: "/ingest/static/:path*",
        destination: "https://us-assets.posthog.com/static/:path*",
      },
      {
        // Event ingestion endpoint (captures, session recordings, etc.)
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
