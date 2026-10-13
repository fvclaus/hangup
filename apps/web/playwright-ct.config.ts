import { defineConfig, devices } from "@playwright/experimental-ct-react";
import path from "path";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./playwright",

  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: "./__snapshots__",
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // Disabled so it doesn't block the test job from finishing
  reporter: [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], locale: "en-US" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], locale: "en-US" },
    },
    // TODO Safari is currently not working not sure why.
    // TODO Make this run in a docker container for better portability
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"], locale: "en-US" },
    // },
  ],
});
