import { test, expect } from "@playwright/test";
import { capture } from "./helpers";

// Matches the default in .dev.vars for local/dev runs.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "lumantic-admin-dev";

test.describe("admin CSV export", () => {
	test("logs in and downloads registrations as CSV", async ({ page, request }, testInfo) => {
		const project = testInfo.project.name;

		// Ensure at least one row exists so the export button is enabled.
		await request.post("/api/register", {
			data: { email: `admin-export-${Date.now()}@example.com` },
		});

		await page.goto("/admin");
		await expect(page.getByRole("heading", { name: "Admin access" })).toBeVisible({ timeout: 15_000 });
		await page.getByPlaceholder("Password").fill(ADMIN_PASSWORD);
		await page.getByRole("button", { name: "Sign in" }).click();

		await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible({ timeout: 15_000 });
		await page.getByRole("button", { name: "Email waitlist" }).click();
		const downloadButton = page.getByRole("button", { name: /download csv/i });
		await expect(downloadButton).toBeVisible();
		await capture(page, project, "admin-dashboard");

		const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);

		expect(download.suggestedFilename()).toMatch(/^lumantic-registrations-\d{4}-\d{2}-\d{2}\.csv$/);
		const stream = await download.createReadStream();
		const chunks: Buffer[] = [];
		for await (const chunk of stream!) chunks.push(chunk as Buffer);
		const csv = Buffer.concat(chunks).toString("utf-8");
		expect(csv.split(/\r\n|\n/)[0]).toBe("email,created_at");
	});
});
