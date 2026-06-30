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

const nextConfig: NextConfig = {
  images: {
    // remotePatterns,
  },
};

export default nextConfig;
