import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { appTranslationResources } from "../../../shared/i18n/resources";
import { DEFAULT_UI_LOCALE, UI_LOCALES } from "../../../shared/locale";

/** i18next instance for the /app product UI only. Landing page stays English. */
void i18n.use(initReactI18next).init({
	resources: appTranslationResources,
	lng: DEFAULT_UI_LOCALE,
	fallbackLng: DEFAULT_UI_LOCALE,
	supportedLngs: [...UI_LOCALES],
	defaultNS: "translation",
	interpolation: {
		escapeValue: false,
	},
	returnNull: false,
});

export default i18n;
