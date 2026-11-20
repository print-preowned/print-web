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

// Each section has its own host (store, seller., admin.), and the host decides
// the section. Refuse to start without all three.
const SECTION_URL_VARS = [
  "NEXT_PUBLIC_STORE_URL",
  "NEXT_PUBLIC_SELLER_URL",
  "NEXT_PUBLIC_ADMIN_URL",
] as const;
const missingSectionUrls = SECTION_URL_VARS.filter((name) => !process.env[name]);
if (missingSectionUrls.length > 0) {
  throw new Error(
    `Set ${missingSectionUrls.join(", ")}: each section runs on its own host. See README.md.`,
  );
}

const allowedDevOrigins = [
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ??
    []),
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
    : []),
  ...SECTION_URL_VARS.map((name) => new URL(process.env[name]!).hostname),
].filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    // remotePatterns,
  },
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
