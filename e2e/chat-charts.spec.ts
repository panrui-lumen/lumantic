import { test, expect } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

test.describe("chat chart artifacts", () => {
	test("pie, area, and stacked bar fixtures render", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);

		await page.goto("/app?c=9007&scope=global");
		await expect(page.getByText(/Google OAuth/i).first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(".recharts-pie").first()).toBeVisible();
		await capture(page, project, "chart-pie");

		await page.goto("/app?c=9008&scope=global");
		await expect(page.getByText(/1,180/i).first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(".recharts-area").first()).toBeVisible();
		await capture(page, project, "chart-area");

		await page.goto("/app?c=9009&scope=global");
		await expect(page.getByText(/shifting upmarket/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(".recharts-bar").first()).toBeVisible();
		await capture(page, project, "chart-stacked-bar");

		await page.goto("/app?c=9010&scope=global");
		await expect(page.getByText(/Page Viewed/i).first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("Segment").first()).toBeVisible();
		await capture(page, project, "connector-segment");

		await page.goto("/app?c=9011&scope=global");
		await expect(page.getByText(/Activation is improving/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("Mixpanel").first()).toBeVisible();
		await expect(page.getByText("Segment").first()).toBeVisible();
		await capture(page, project, "connector-mixpanel");

		await page.goto("/app?c=9003&scope=global");
		await expect(page.getByText(/most recent Beacon client crashes/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("Sentry").first()).toBeVisible();
		await expect(page.getByText("LaunchDarkly").first()).toBeVisible();
		await capture(page, project, "connector-sentry");

		await page.goto("/app?c=9006&scope=global");
		await expect(page.getByText(/shipped auth bug/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText("incident.io").first()).toBeVisible();
		await capture(page, project, "connector-incident-io");

		await page.goto("/app?c=9012&scope=global");
		await expect(page.getByText(/How do we prevent this happening again/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole("link", { name: /Open PR/i })).toBeVisible();
		await expect(page.getByText("src/web/charts/SignalsChart.tsx").first()).toBeVisible();
		await capture(page, project, "code-fix-open-pr");
	});
});
