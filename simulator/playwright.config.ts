import { defineConfig, devices } from '@playwright/test';

/* SIM_BASE_URL points the suite at an already-running server (a `vite dev
   --port N`), so several checkouts or agents can test at once without
   sharing build/ and port 4173. Unset: build + static server as before. */
const external = process.env.SIM_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: external ?? 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1400, height: 900 },
    ignoreHTTPSErrors: true
  },
  webServer: external ? undefined : {
    command: 'npx http-server build -p 4173 -s --silent -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
