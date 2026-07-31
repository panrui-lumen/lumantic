import {
	DEFAULT_UI_LOCALE_PREFERENCE,
	detectBrowserUiLocale,
	resolveUiLocale,
	type UiLocale,
	type UiLocalePreference,
	UI_LOCALE_META,
} from "../../../shared/locale";
import { useEffect, useMemo, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useAppAuth } from "./context";
import i18n from "./i18n-instance";

export function AppI18nProvider({ children }: { children: ReactNode }) {
	return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

/** Syncs account language preference (including auto-detect) into i18next. */
export function AppLocaleSync({ children }: { children: ReactNode }) {
	const { user } = useAppAuth();
	const preference = (user?.uiLocale ?? DEFAULT_UI_LOCALE_PREFERENCE) as UiLocalePreference;
	const detectedLocale = useMemo(() => detectBrowserUiLocale(), []);
	const locale = useMemo(
		() => resolveUiLocale(preference, typeof navigator !== "undefined" ? navigator.languages : [detectedLocale]),
		[preference, detectedLocale],
	);

	useEffect(() => {
		if (i18n.language !== locale) {
			void i18n.changeLanguage(locale);
		}
		document.documentElement.lang = locale;
	}, [locale]);

	return children;
}

export function useAppI18n() {
	const { t, i18n: instance } = useTranslation();
	const { user } = useAppAuth();
	const preference = (user?.uiLocale ?? DEFAULT_UI_LOCALE_PREFERENCE) as UiLocalePreference;
	const detectedLocale = useMemo(() => detectBrowserUiLocale(), []);
	const locale = (instance.resolvedLanguage ?? instance.language ?? detectedLocale) as UiLocale;

	return {
		t,
		i18n: instance,
		preference,
		locale,
		detectedLocale,
		detectedLabel: UI_LOCALE_META[detectedLocale].nativeLabel,
	};
}

/** Convenience alias matching earlier call sites. */
export function useT() {
	return useTranslation().t;
}

export function useI18n() {
	return useAppI18n();
}

/** @deprecated Use AppI18nProvider */
export const I18nProvider = AppI18nProvider;
