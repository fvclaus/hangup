module.exports = {
  output: "standalone",
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
  serverExternalPackages: [
    "@google-cloud/firestore",
    "@google-cloud/tasks",
    "@google-apps/meet",
    "googleapis",
    "@google-cloud/local-auth",
  ],
};
