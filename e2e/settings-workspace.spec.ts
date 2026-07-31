import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo } from "./helpers";

test.describe("settings notifications and workspace", () => {
	test("notifications and workspace tabs for admins", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await goToNav(page, /^Settings/);
		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

		await page.getByRole("button", { name: "Notifications", exact: true }).click();
		await expect(page.getByText("Proposed memories")).toBeVisible();
		await expect(page.getByText("Daily digest")).toBeVisible();
		await expect(page.getByRole("switch").first()).toBeVisible();
		await capture(page, project, "settings-notifications");

		await page.getByRole("button", { name: "Workspace", exact: true }).click();
		await expect(page.getByLabel("Company name")).toBeVisible();
		await expect(page.getByLabel("Allowed email domains")).toBeVisible();
		await expect(page.getByRole("button", { name: "Delete workspace" })).toBeVisible();
		await capture(page, project, "settings-workspace");
	});
});
