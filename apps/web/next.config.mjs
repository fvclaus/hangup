/**
 * Frontend (Cloudflare) Next.js config.
 *
 * The browser only ever talks to this origin; `/api/*` is reverse-proxied to the
 * backend Next.js app on Cloud Run (`API_ORIGIN`), so there is no CORS and the
 * session cookie stays first-party. Server-to-server fetch forwards cookies and
 * returns Set-Cookie / 3xx transparently.
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3001";

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: "anonymous",
  transpilePackages: ["@hangup/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.claude/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
