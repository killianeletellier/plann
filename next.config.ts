import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  ...(isDev && {
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((origin) => origin.trim())
      : ["10.*.*.*", "192.168.*.*"],
  }),
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
