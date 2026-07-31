import {
	detectBrowserUiLocale,
	isUiLocalePreference,
	mapLanguageTagToUiLocale,
	resolveUiLocale,
} from "../locale";
import { appTranslationResources } from "../i18n/resources";

describe("locale", () => {
	it("maps language tags onto supported UI locales", () => {
		expect(mapLanguageTagToUiLocale("en-US")).toBe("en-US");
		expect(mapLanguageTagToUiLocale("en-GB")).toBe("en-GB");
		expect(mapLanguageTagToUiLocale("en-AU")).toBe("en-GB");
		expect(mapLanguageTagToUiLocale("de-DE")).toBe("de");
		expect(mapLanguageTagToUiLocale("es-MX")).toBe("es");
		expect(mapLanguageTagToUiLocale("fr-CA")).toBe("fr");
		expect(mapLanguageTagToUiLocale("ja-JP")).toBe("en-US");
	});

	it("resolves auto from browser languages", () => {
		expect(resolveUiLocale("auto", ["fr-FR", "en"])).toBe("fr");
		expect(resolveUiLocale("de", ["fr-FR"])).toBe("de");
		expect(detectBrowserUiLocale(["es-ES"])).toBe("es");
	});

	it("accepts preference values", () => {
		expect(isUiLocalePreference("auto")).toBe(true);
		expect(isUiLocalePreference("en-GB")).toBe(true);
		expect(isUiLocalePreference("pt")).toBe(false);
	});
});

describe("appTranslationResources", () => {
	it("includes every supported locale", () => {
		expect(Object.keys(appTranslationResources).sort()).toEqual(["de", "en-GB", "en-US", "es", "fr"].sort());
	});

	it("keeps German nav labels translated", () => {
		expect(appTranslationResources.de.translation.nav.settings).toBe("Einstellungen");
		expect(appTranslationResources.es.translation.settings.language).toBe("Idioma");
	});
});
