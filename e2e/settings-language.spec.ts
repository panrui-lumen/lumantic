import { test, expect } from "@playwright/test";
import { capture, loginAsDemo } from "./helpers";

test.describe("app language settings", () => {
	test("switching language updates /app chrome, not landing", async ({ page }, testInfo) => {
		const project = testInfo.project.name;
		await loginAsDemo(page);

		await page.getByRole("button", { name: /Account settings|Kontoeinstellungen|Ajustes de cuenta|Paramètres du compte/ }).click();
		await expect(
			page.getByRole("heading", { name: /Account settings|Kontoeinstellungen|Ajustes de cuenta|Paramètres du compte/ }),
		).toBeVisible({ timeout: 15_000 });

		const language = page.getByLabel(/Language|Sprache|Idioma|Langue/);
		await expect(language).toBeVisible({ timeout: 15_000 });
		await language.selectOption("de");
		await expect(page.getByRole("heading", { name: "Kontoeinstellungen" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("heading", { name: "Anzeige" })).toBeVisible();
		await capture(page, project, "account-language-de");

		await language.selectOption("en-US");
		await expect(page.getByRole("heading", { name: "Account settings" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("heading", { name: "Display" })).toBeVisible();

		await page.goto("/");
		await expect(page.getByRole("heading", { name: "Kontoeinstellungen" })).toHaveCount(0);
		await capture(page, project, "landing-stays-english");
	});
});
