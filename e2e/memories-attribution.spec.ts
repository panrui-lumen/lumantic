import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo } from "./helpers";

test.describe("memory attribution", () => {
	test("shows avatar or Lumantic icon next to attribution names", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await goToNav(page, /^Memories/);
		await expect(page.getByRole("heading", { name: "Memories" })).toBeVisible();

		const manual = page.getByText(/Added manually by/i).first();
		await expect(manual).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole("button", { name: /View Sam Rivera'?s profile/i }).first()).toBeVisible();

		const learned = page.getByText(/Learned by/i).first();
		await expect(learned).toBeVisible();
		await expect(page.getByRole("button", { name: /View Lumantic'?s profile/i }).first()).toBeVisible();

		await capture(page, project, "memories-attribution");
	});
});
