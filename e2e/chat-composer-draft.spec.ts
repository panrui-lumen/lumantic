import { test, expect, type Page } from "@playwright/test";
import { loginAsDemo } from "./helpers";

async function openChatHistory(page: Page) {
	const personal = page.getByRole("button", { name: "Personal" });
	if (
		await personal
			.first()
			.isVisible()
			.catch(() => false)
	) {
		return;
	}
	await page.getByRole("button", { name: "Chat history" }).click();
	await expect(personal.last()).toBeVisible({ timeout: 10_000 });
}

function historyPanel(page: Page) {
	return page.locator("div.flex.h-full.flex-col.bg-ink").last();
}

async function startNewChatInScope(page: Page, scope: "Personal" | "Global") {
	await openChatHistory(page);
	const history = historyPanel(page);
	await history.getByRole("button", { name: scope, exact: true }).click();
	await history.locator("button").filter({ hasText: /^New chat$/ }).click();
	await expect(page.getByPlaceholder("Message Lumantic…")).toBeVisible({ timeout: 10_000 });
}

test.describe("chat composer draft", () => {
	test("persists composer text across reload", async ({ page }) => {
		const stamp = Date.now();
		const draft = `E2E composer draft ${stamp}`;

		await loginAsDemo(page);
		await startNewChatInScope(page, "Personal");

		const input = page.getByPlaceholder("Message Lumantic…");
		await input.fill(draft);
		await expect(input).toHaveValue(draft);

		await expect
			.poll(async () =>
				page.evaluate(() => localStorage.getItem("lumantic-chat-composer-draft:personal:new")),
			)
			.toBe(draft);

		await page.reload({ waitUntil: "networkidle" });
		await expect(page.getByPlaceholder("Message Lumantic…")).toBeVisible({ timeout: 20_000 });
		await expect(page.getByPlaceholder("Message Lumantic…")).toHaveValue(draft, { timeout: 10_000 });
	});
});
