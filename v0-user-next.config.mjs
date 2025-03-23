/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Enable Turbopack for faster development builds
      resolveAlias: {
        // Add any aliases if needed
      },
    },
    // Enable streaming metadata for improved performance
    streamingMetadata: true,
  },
};

export default nextConfig;

