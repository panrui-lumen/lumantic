import { test, expect, type Page } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

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
	// Prefer the <button> CTA; conversation rows can also be named "New chat".
	await history.locator("button").filter({ hasText: /^New chat$/ }).click();
	await expect(page.getByPlaceholder("Message Lumantic…")).toBeVisible({ timeout: 10_000 });
}

async function sendChatMessage(page: Page, text: string) {
	const input = page.getByPlaceholder("Message Lumantic…");
	await input.fill(text);
	await page.getByRole("button", { name: "Send message" }).click();
	await expect(page.getByText(text, { exact: true })).toBeVisible({ timeout: 10_000 });
}

async function expectAssistantReply(page: Page) {
	await expect(page.getByRole("button", { name: "Reply details" }).first()).toBeVisible({
		timeout: 20_000,
	});
}

test.describe("chat conversations", () => {
	test("personal and global scopes can send and receive a reply", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		const stamp = Date.now();
		await loginAsDemo(page);

		await startNewChatInScope(page, "Personal");
		const personalQuestion = `E2E personal ping ${stamp}`;
		await sendChatMessage(page, personalQuestion);
		await expectAssistantReply(page);
		await capture(page, project, "chat-conversation-personal");

		await startNewChatInScope(page, "Global");
		const globalQuestion = `E2E global ping ${stamp}`;
		await sendChatMessage(page, globalQuestion);
		await expect(page.getByText(globalQuestion, { exact: true })).toBeVisible();
		await expectAssistantReply(page);
		await capture(page, project, "chat-conversation-global");
	});
});
