import { test, expect } from "@playwright/test";
import { capture } from "./helpers";

async function pageHasHorizontalOverflow(page: import("@playwright/test").Page) {
	return page.evaluate(() => {
		const doc = document.documentElement;
		const body = document.body;
		const scrollWider = Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
		const overflowing = [...document.querySelectorAll("h1, h2, header, main")].some((el) => {
			const html = el as HTMLElement;
			return html.scrollWidth > html.clientWidth + 1;
		});
		return scrollWider || overflowing;
	});
}

test.describe("landing page", () => {
	test("hero fits viewport without horizontal overflow", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await page.goto("/", { waitUntil: "networkidle" });

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByText("Growing fast.")).toBeVisible();
		await expect(page.getByText(/Lumantic fixes all three in 2 months/i)).toBeVisible();
		await expect(page.getByText("to help you grow even faster.")).toBeVisible();

		expect(await pageHasHorizontalOverflow(page)).toBe(false);

		await capture(page, project, "landing-hero");
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForTimeout(300);
		await capture(page, project, "landing-full");
	});
});
