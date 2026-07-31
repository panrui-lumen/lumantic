import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"]],
	timeout: 60_000,
	expect: { timeout: 10_000 },
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "off",
	},
	projects: [
		{
			name: "desktop",
			use: {
				browserName: "chromium",
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "mobile",
			use: {
				browserName: "chromium",
				...devices["iPhone 13"],
			},
		},
	],
});
