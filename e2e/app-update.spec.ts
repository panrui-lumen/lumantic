import { test, expect } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

const UPDATE_COPY = /Lumantic (has been updated|wurde aktualisiert)/i;
const REFRESH_BUTTON = /^(Refresh|Aktualisieren)$/;

async function mockNewerVersion(page: import("@playwright/test").Page) {
	// Match cache-busted fetches like `/version.json?_=…`.
	await page.route(/\/version\.json(\?|$)/, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ buildId: "e2e-newer-build" }),
			headers: { "Cache-Control": "no-store" },
		});
	});
}

async function simulateUpdateToastViaCmdK(page: import("@playwright/test").Page) {
	await page.keyboard.press("Meta+k");
	const input = page.getByPlaceholder("Jump to a page, chat, or action...");
	await expect(input).toBeVisible();
	await input.fill("simulate app update");
	await page.getByRole("button", { name: /Simulate app update toast/i }).click();
	// Dev action defers the toast slightly past the palette click.
	await page.waitForTimeout(150);
}

test.describe("app update toast", () => {
	test("Cmd+K can simulate the update toast on /app", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await simulateUpdateToastViaCmdK(page);

		await expect(page.getByText(UPDATE_COPY)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("button", { name: REFRESH_BUTTON })).toBeVisible();
		await expect(page.locator("[data-sonner-toast]").filter({ hasText: UPDATE_COPY })).toHaveAttribute(
			"data-removed",
			"false",
		);
		await capture(page, project, "app-update-toast");
	});

	test("does not show on the landing page", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await mockNewerVersion(page);
		await page.goto("/", { waitUntil: "networkidle" });
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		// Watcher is not started on landing; give a beat so a mistaken poll would toast.
		await page.waitForTimeout(1500);
		await expect(page.getByText(UPDATE_COPY)).toHaveCount(0);
		await capture(page, project, "landing-no-update-toast");
	});
});
