import { expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

export const DEMO_EMAIL = "test@example.com";
export const DEMO_PASSWORD = "3F*PVVkB8dkIImwipIBVp0Z$";

/** Agent verification screenshots (never commit). */
export const SHOT_DIR = "/tmp/lumantic-e2e";

export function shotPath(projectName: string, label: string) {
	mkdirSync(SHOT_DIR, { recursive: true });
	const safe = label.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "");
	return `${SHOT_DIR}/${projectName}-${safe}.png`;
}

export async function loginAsDemo(page: Page) {
	await page.goto("/app");
	await page.evaluate(() => localStorage.removeItem("lumantic_app_token"));
	await page.reload({ waitUntil: "networkidle" });
	await page.getByPlaceholder("Email").waitFor({ state: "visible", timeout: 20_000 });
	await page.getByPlaceholder("Email").fill(DEMO_EMAIL);
	await page.getByPlaceholder("Password").fill(DEMO_PASSWORD);
	await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
	// Desktop: primary Chat nav (may include unread badge). Mobile: hamburger.
	await expect(
		page
			.getByRole("button", { name: /^Chat(?: \d+ unread chats?)?$/ })
			.or(page.getByRole("button", { name: "Open menu" })),
	).toBeVisible({ timeout: 20_000 });
}

const chatNavName = /^Chat(?: \d+ unread chats?)?$/;

/** Ensure primary nav is reachable (opens the mobile drawer when needed). */
export async function openAppNav(page: Page) {
	const chatBtn = page.getByRole("button", { name: chatNavName });
	if (await chatBtn.isVisible().catch(() => false)) return;
	await page.getByRole("button", { name: "Open menu" }).click();
	await expect(chatBtn).toBeVisible({ timeout: 10_000 });
}

export async function goToNav(page: Page, name: string | RegExp) {
	await openAppNav(page);
	await page.getByRole("button", { name }).first().click();
}

export async function openOutageFixture(page: Page) {
	await page.goto("/app?c=9006&scope=global");
	await expect(page.getByRole("heading", { name: /why did the app go down last week/i })).toBeVisible({
		timeout: 15_000,
	});
}

export async function capture(page: Page, projectName: string, label: string) {
	const path = shotPath(projectName, label);
	await page.screenshot({ path, fullPage: true });
	return path;
}
