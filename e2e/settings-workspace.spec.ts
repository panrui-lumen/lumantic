import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo } from "./helpers";

test.describe("workspace settings", () => {
	test("integrations and workspace tabs for admins", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await goToNav(page, /Workspace settings|Settings/);
		await expect(page.getByRole("heading", { name: /Workspace settings|Settings/ })).toBeVisible();

		await expect(page.getByRole("button", { name: "Integrations", exact: true })).toBeVisible();
		await capture(page, project, "settings-integrations");

		await page.getByRole("button", { name: "Workspace", exact: true }).click();
		await expect(page.getByLabel("Company name")).toBeVisible();
		await expect(page.getByLabel("Allowed email domains")).toBeVisible();
		await expect(page.getByRole("button", { name: "Delete workspace" })).toBeVisible();
		await capture(page, project, "settings-workspace");
	});
});
