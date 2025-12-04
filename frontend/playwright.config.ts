import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\\.e2e\\.spec\\.ts$/,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  use: { baseURL: 'http://localhost:8080', headless: true },
});
