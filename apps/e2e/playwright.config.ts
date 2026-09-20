import { defineConfig, devices } from '@playwright/test'

// Playwright's built-in json reporter honors PLAYWRIGHT_JSON_OUTPUT_NAME as an
// env var natively (see https://playwright.dev/docs/test-reporters#json-reporter),
// so entrypoint.sh sets that directly rather than us wiring outputFile here.
// baseURL is read lazily by each project below via config/env.ts, so `playwright
// test --list` and typecheck work fine with no env vars set.

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['json']],
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        get baseURL() {
          return process.env.BASE_URL
        },
        trace: 'on-first-retry',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        get baseURL() {
          return process.env.API_BASE_URL
        },
      },
    },
  ],
})
