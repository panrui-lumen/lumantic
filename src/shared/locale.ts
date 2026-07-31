/** Supported UI locales for the product app. */
export const UI_LOCALES = ["en-US", "en-GB", "de", "es", "fr"] as const;

export type UiLocale = (typeof UI_LOCALES)[number];
export type UiLocalePreference = "auto" | UiLocale;

export const DEFAULT_UI_LOCALE: UiLocale = "en-US";
export const DEFAULT_UI_LOCALE_PREFERENCE: UiLocalePreference = "auto";

export const UI_LOCALE_META: Record<
	UiLocale,
	{ label: string; nativeLabel: string; shortLabel: string }
> = {
	"en-US": { label: "English (US)", nativeLabel: "English (US)", shortLabel: "EN-US" },
	"en-GB": { label: "English (UK)", nativeLabel: "English (UK)", shortLabel: "EN-GB" },
	de: { label: "German", nativeLabel: "Deutsch", shortLabel: "DE" },
	es: { label: "Spanish", nativeLabel: "Español", shortLabel: "ES" },
	fr: { label: "French", nativeLabel: "Français", shortLabel: "FR" },
};

export function isUiLocale(value: string): value is UiLocale {
	return (UI_LOCALES as readonly string[]).includes(value);
}

export function isUiLocalePreference(value: string): value is UiLocalePreference {
	return value === "auto" || isUiLocale(value);
}

/** Map a BCP 47 / navigator language tag onto a supported UI locale. */
export function mapLanguageTagToUiLocale(tag: string): UiLocale {
	const normalized = tag.trim().replace(/_/g, "-");
	if (!normalized) return DEFAULT_UI_LOCALE;
	const lower = normalized.toLowerCase();
	const [language, region] = lower.split("-");

	if (language === "de") return "de";
	if (language === "es") return "es";
	if (language === "fr") return "fr";
	if (language === "en") {
		if (region === "gb" || region === "uk" || region === "ie" || region === "au" || region === "nz") {
			return "en-GB";
		}
		return "en-US";
	}

	return DEFAULT_UI_LOCALE;
}

export function detectBrowserUiLocale(
	languages: readonly string[] = typeof navigator !== "undefined" ? navigator.languages : [],
	fallback = typeof navigator !== "undefined" ? navigator.language : DEFAULT_UI_LOCALE,
): UiLocale {
	const candidates = [...languages, fallback].filter(Boolean);
	for (const tag of candidates) {
		const mapped = mapLanguageTagToUiLocale(tag);
		if (mapped) return mapped;
	}
	return DEFAULT_UI_LOCALE;
}

export function resolveUiLocale(
	preference: UiLocalePreference,
	browserLanguages?: readonly string[],
): UiLocale {
	if (preference !== "auto") return preference;
	return detectBrowserUiLocale(browserLanguages);
}
