/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google account avatars
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // pdfkit reads its .afm font metrics from disk relative to its own
    // package folder at runtime — webpack-bundling it into .next/server
    // breaks that lookup, so it needs to stay a plain, unbundled require.
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
