/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
  transpilePackages: [
    "@mui/material",
    "@mui/icons-material",
    "@mui/material-nextjs",
  ],
};

module.exports = withPWA(nextConfig);
