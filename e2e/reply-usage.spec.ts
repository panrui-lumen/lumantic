import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo, openOutageFixture } from "./helpers";

test.describe("reply usage and display currency", () => {
	test("shows tokens and cost on Lumantic replies; currency from company settings", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);

		await goToNav(page, /^Settings/);
		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
		const currency = page.getByLabel("Display currency");
		await expect(currency).toBeVisible({ timeout: 15_000 });
		await currency.selectOption("GBP");
		await expect(currency).toHaveValue("GBP");
		await capture(page, project, "settings-currency");

		await goToNav(page, /^Chat(?: \d+ unread chats?)?$/);
		await openOutageFixture(page);
		const meta = page.getByRole("button", { name: "Reply details" }).first();
		await expect(meta).toBeVisible({ timeout: 15_000 });
		await expect(meta).toContainText(/\d[\d,]* in/i);
		await expect(meta).toContainText(/\d[\d,]* out/i);
		await expect(meta).toContainText(/\d+(\.\d+)?s|\d+ms/i);
		await expect(meta).toContainText(/£/);
		await meta.click();
		await expect(page.getByRole("heading", { name: "Reply details" })).toBeVisible();
		await expect(page.getByText("Tokens in")).toBeVisible();
		await expect(page.getByText("Tokens out")).toBeVisible();
		await expect(page.getByText("Time to answer")).toBeVisible();
		await expect(page.getByText("How Lumantic answered")).toBeVisible();
		await expect(page.getByText("Sources consulted")).toBeVisible();
		const sqlToggle = page.getByRole("button", { name: "SQL" });
		await expect(sqlToggle).toHaveAttribute("aria-expanded", "true");
		await sqlToggle.click();
		await expect(sqlToggle).toHaveAttribute("aria-expanded", "false");
		await sqlToggle.click();
		await expect(sqlToggle).toHaveAttribute("aria-expanded", "true");
		await capture(page, project, "reply-usage");
	});
});
