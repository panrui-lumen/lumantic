import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo } from "./helpers";

test.describe("settings admin access", () => {
	test("Owner sees Settings; Member does not", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);

		// Demo user Avery is Owner: Settings must be available.
		await goToNav(page, /^Settings/);
		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 15_000 });
		await capture(page, project, "settings-admin");

		await page.route("**/api/app/session", async (route) => {
			const res = await route.fetch();
			const json = await res.json();
			json.user = { ...json.user, workspaceRole: "Member" };
			await route.fulfill({ status: res.status(), headers: res.headers(), json });
		});
		await page.reload({ waitUntil: "networkidle" });
		await expect(
			page
				.getByRole("button", { name: /^Chat(?: \d+ unread chats?)?$/ })
				.or(page.getByRole("button", { name: "Open menu" })),
		).toBeVisible({ timeout: 20_000 });

		const menu = page.getByRole("button", { name: "Open menu" });
		if (await menu.isVisible().catch(() => false)) await menu.click();

		await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCount(0);
		await page.goto("/app/settings");
		await expect(page).not.toHaveURL(/\/app\/settings$/);
		await capture(page, project, "settings-member-hidden");
	});
});
