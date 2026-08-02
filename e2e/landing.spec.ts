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
	test("uses yellow favicon in local Vite serve", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const iconHref = await page.locator('link[rel="icon"]').getAttribute("href");
		expect(iconHref).toBe("/lumantic-logo-dev.png");
		const appleHref = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
		expect(appleHref).toBe("/lumantic-logo-dev.png");
		const iconRes = await page.request.get("/lumantic-logo-dev.png");
		expect(iconRes.ok()).toBe(true);
	});

	test("hero fits viewport without horizontal overflow", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await page.goto("/", { waitUntil: "networkidle" });

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByText("Growing fast.")).toBeVisible();
		await expect(page.getByText(/Lumantic fixes all three in 2[\s\u00a0]weeks/i)).toBeVisible();
		await expect(page.getByText(/to help you grow even faster/i)).toBeVisible();

		if (project === "desktop") {
			const painLineHeight = await page.locator("h1 > span").first().evaluate((el) => el.getBoundingClientRect().height);
			expect(painLineHeight).toBeLessThan(48);
		}

		const headline = page.locator("h1 > span").nth(1);
		await expect(headline).toContainText(/Lumantic fixes all three in 2[\s\u00a0]weeks to help you grow even faster\./);

		expect(await pageHasHorizontalOverflow(page)).toBe(false);

		await capture(page, project, "landing-hero");
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForTimeout(300);
		await capture(page, project, "landing-full");
	});
});
