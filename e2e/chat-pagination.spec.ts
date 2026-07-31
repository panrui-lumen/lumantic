import { test, expect, type Page } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

async function openChatHistory(page: Page) {
	const personal = page.getByRole("button", { name: "Personal" });
	if (
		await personal
			.first()
			.isVisible()
			.catch(() => false)
	)
		return;
	await page.getByRole("button", { name: "Chat history" }).click();
	await expect(personal.last()).toBeVisible({ timeout: 10_000 });
}

function historyPanel(page: Page) {
	// Desktop sidebar is always mounted (often hidden on mobile); the drawer mounts after it.
	return page.locator("div.flex.h-full.flex-col.bg-ink").last();
}

test.describe("chat pagination", () => {
	test("lists paginate and messages reverse-load on scroll up", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await openChatHistory(page);

		const history = historyPanel(page);
		await history.getByRole("button", { name: "Personal" }).click();
		await expect(history.getByText(/showing 1-20 of/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "chat-list-page-1");

		await history.getByRole("button", { name: "Next page" }).click();
		await expect(history.getByText(/showing 21-/i)).toBeVisible({ timeout: 10_000 });
		await capture(page, project, "chat-list-page-2");

		await history.getByRole("button", { name: "Previous page" }).click();
		await history.getByRole("button", { name: /Beacon metrics deep dive/i }).click();

		await expect(page.getByText(/Scroll up for earlier messages|Fetching later messages/i).first()).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByText(/Turn 55 about Beacon metrics/i)).toBeVisible();
		await expect(page.getByText(/Turn 1 about Beacon metrics/i)).toHaveCount(0);

		const scroller = page.locator("div.flex-1.space-y-5.overflow-y-auto").filter({
			hasText: /Turn 55 about Beacon metrics/i,
		});
		await scroller.evaluate((el) => {
			el.scrollTop = 0;
		});
		await expect(page.getByText(/Turn 1 about Beacon metrics/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "chat-messages-earlier");
	});
});
