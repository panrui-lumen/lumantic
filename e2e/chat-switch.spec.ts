import { test, expect } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

async function openChatHistoryIfNeeded(page: import("@playwright/test").Page) {
	const historyBtn = page.getByRole("button", { name: "Chat history" });
	if (await historyBtn.isVisible().catch(() => false)) {
		await historyBtn.click();
	}
}

test.describe("chat switching", () => {
	test("selecting another global chat updates the header and messages", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await openChatHistoryIfNeeded(page);

		const firstTitle = /Why did the app go down last week/i;
		const secondTitle = /Why did signups drop off in March/i;

		await page.getByRole("button", { name: firstTitle }).click();
		await expect(page.getByRole("heading", { name: firstTitle })).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "chat-switch-first");

		await openChatHistoryIfNeeded(page);
		await page.getByRole("button", { name: secondTitle }).click();
		await expect(page.getByRole("heading", { name: secondTitle })).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole("heading", { name: firstTitle })).toHaveCount(0);
		await capture(page, project, "chat-switch-second");
	});

	test("clicking the Slack badge area still switches chats", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await openChatHistoryIfNeeded(page);

		const firstTitle = /Why did the app go down last week/i;
		const secondTitle = /Why did signups drop off in March/i;
		const secondRow = page.getByRole("button", { name: secondTitle });
		await expect(secondRow).toBeVisible({ timeout: 15_000 });

		const box = await secondRow.boundingBox();
		expect(box).toBeTruthy();
		await page.mouse.click(box!.x + box!.width - 12, box!.y + box!.height - 12);
		await expect(page.getByRole("heading", { name: secondTitle })).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole("heading", { name: firstTitle })).toHaveCount(0);
		await capture(page, project, "chat-switch-slack-hit");
	});
});
