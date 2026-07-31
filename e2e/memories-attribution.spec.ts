import { test, expect } from "@playwright/test";
import { capture, goToNav, loginAsDemo } from "./helpers";

test.describe("memory attribution", () => {
	test("manual memories show Added manually by name without avatar chip", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);
		await goToNav(page, /^Memories/);
		await expect(page.getByRole("heading", { name: "Memories" })).toBeVisible();

		const combined = page.getByText(/Added manually by Sam Rivera/i);
		await expect(combined.first()).toBeVisible({ timeout: 15_000 });

		// No separate "Added manually" label sitting beside a profile chip.
		await expect(page.getByText("Added manually", { exact: true })).toHaveCount(0);

		await capture(page, project, "memories-attribution");
	});
});
