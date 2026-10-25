import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  images: {
    // AVIF روی سرور تک‌هسته‌ای برای هر تصویر تا یک دقیقه CPU می‌گیرد؛ WebP چند برابر سریع‌تر است
    formats: ["image/webp"],
    minimumCacheTTL: 2592000,
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/images/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
