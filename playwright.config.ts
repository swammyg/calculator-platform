import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { trace: "on-first-retry", screenshot: "only-on-failure", video: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } }
  ],
  webServer: [
    { command: "python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000", url: "http://127.0.0.1:8000/api/v1/health", reuseExistingServer: !process.env.CI, timeout: 30_000 },
    { command: "VITE_GA_MEASUREMENT_ID=G-TEST VITE_ADSENSE_MODE=test npm run dev -- --host 0.0.0.0 --port 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI, timeout: 30_000 }
  ]
});
