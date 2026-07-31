import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo, openOutageFixture } from "./helpers";

test.describe("app smoke", () => {
	test("login, outage fixture, memories pagination", async ({ page }, testInfo) => {
		const project = testInfo.project.name;

		await page.goto("/app");
		await page.evaluate(() => localStorage.removeItem("lumantic_app_token"));
		await page.reload({ waitUntil: "networkidle" });
		await expect(page.getByRole("button", { name: /sign in with slack/i })).toBeVisible({ timeout: 20_000 });
		await capture(page, project, "auth");

		await loginAsDemo(page);
		await capture(page, project, "chat");

		await openOutageFixture(page);
		await capture(page, project, "outage");

		await goToNav(page, /^Memories/);
		await expect(page.getByRole("heading", { name: "Memories" })).toBeVisible();
		await expect(page.getByText(/showing 1-5 of/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "memories");

		await goToNav(page, /proposed/i);
		await expect(page.getByText(/showing 1-5 of/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "proposed");

		await goToNav(page, /^Team/);
		await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
		await expect(page.getByText(/showing 1-5 of/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "team");

		await goToNav(page, /^Billing/);
		await expect(page.getByRole("heading", { name: "Billing", exact: true })).toBeVisible();
		await expect(page.getByText(/showing 1-5 of 12/i)).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "billing");
	});
});
