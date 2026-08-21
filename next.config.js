/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Only import the icons/components actually used from these
    // libraries instead of the whole package — smaller JS bundles,
    // faster hydration on every page.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  compress: true,
};

module.exports = nextConfig;
