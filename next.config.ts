import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  async redirects() {
    return [
      {
        source: "/modules/architecture",
        destination: "/modules/intermediate",
        permanent: true,
      },
      {
        source: "/modules/architecture/:path*",
        destination: "/modules/intermediate/:path*",
        permanent: true,
      },
      {
        source: "/modules/mastery",
        destination: "/modules/pro",
        permanent: true,
      },
      {
        source: "/modules/mastery/:path*",
        destination: "/modules/pro/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
