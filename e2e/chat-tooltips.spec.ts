import { test, expect } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

async function openChatHistoryIfNeeded(page: import("@playwright/test").Page) {
	const historyBtn = page.getByRole("button", { name: "Chat history" });
	if (await historyBtn.isVisible().catch(() => false)) {
		await historyBtn.click();
	}
}

test.describe("chat title tooltips", () => {
	test("truncated list titles use Radix tooltip, not title attr", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await openChatHistoryIfNeeded(page);

		const truncated = page
			.getByText(/Why did signups drop/i)
			.filter({ visible: true })
			.first();
		await expect(truncated).toBeVisible({ timeout: 15_000 });

		// Never rely only on the native title attribute for the hover tip.
		await expect(page.locator("[title='Why did signups drop off in March?']")).toHaveCount(0);

		await truncated.hover();
		await expect(page.getByRole("tooltip", { name: /Why did signups drop off in March\?/i })).toBeVisible({
			timeout: 5_000,
		});
		await capture(page, project, "chat-title-tooltip");
	});
});
