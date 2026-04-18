import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack is stable in Next.js 15
  experimental: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google https://www.googleadservices.com https://www.googletagservices.com; connect-src 'self' https://generativelanguage.googleapis.com https://*.doubleclick.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://*.googleapis.com wss://*.firebaseio.com https://*.firebaseio.com wss://*.googleapis.com; img-src 'self' data: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.google.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
