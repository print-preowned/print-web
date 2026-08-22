import type { NextConfig } from "next";

const assetsCdnUrl = process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, "");
const cdnHost = assetsCdnUrl ? new URL(assetsCdnUrl).hostname : "";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = cdnHost
  ? [
      {
        protocol: "https",
        hostname: cdnHost,
        pathname: "/**",
      },
    ]
  : [];

const allowedDevOrigins = [
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ??
    []),
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
    : []),
].filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    // remotePatterns,
  },
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
