const path = require("path");

module.exports = {
  output: "standalone",
  // Trace from the monorepo root so the standalone output includes
  // workspace packages and the hoisted pnpm store.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // The standalone tracer misses @google-cloud/tasks' lazily-required JSON
  // files (client config, protos), which are only loaded when
  // CloudTasksClient is constructed at runtime. See vercel/next.js#63368.
  outputFileTracingIncludes: {
    "/api/**": [
      "../../node_modules/.pnpm/@google-cloud+tasks@*/node_modules/@google-cloud/tasks/build/**/*.json",
    ],
  },
  crossOrigin: "anonymous",
  transpilePackages: ["@hangup/shared"],
  // Exclude .claude directory (contains sandbox null devices that crash the file watcher)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.claude/**"],
      };
    }
    return config;
  },
  serverExternalPackages: ["@google-cloud/firestore", "@google-cloud/tasks"],
};
