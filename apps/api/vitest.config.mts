import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],

  test: {
    environment: "jsdom",
    include: ["**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.claude/**",
      "**/*.component.test.ts",
      "**/e2e.test.ts",
    ],
    env: {
      CLIENT_ID: "VITEST_CLIENT_ID",
      CLIENT_SECRET: "VITEST_CLIENT_SECRET",
      PROJECT_ID: "vitest",
      QUEUE_LOCATION: "VITEST_QUEUE_LOCATION",
      SITE_BASE: "VITEST_SITE_BASE",
      CLOUD_TASKS_SERVICE_ACCOUNT: "backend-app@vitest.iam.gserviceaccount.com",
      // Pin the offset so unit tests are hermetic and don't inherit a local
      // .env.local value (e2e sets this to 0 to allow very short meetings).
      NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET: "5",
    },
  },
});
