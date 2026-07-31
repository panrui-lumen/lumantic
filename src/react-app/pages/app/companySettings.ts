import {
	DEFAULT_COMPANY_DATETIME,
	formatAppDateTime,
	resolveDateTimePrefs,
	type ResolvedDateTimePrefs,
	type TimeFormatPreference,
} from "../../../shared/datetime";
import { DEFAULT_UI_LOCALE_PREFERENCE, type UiLocalePreference } from "../../../shared/locale";
import type { CompanySettings } from "./types";
import { useQuery } from "@tanstack/react-query";
import { useAppAuth } from "./context";

export function normalizeCompanySettings(company: Partial<CompanySettings> | null | undefined): CompanySettings {
	return {
		displayCurrency: company?.displayCurrency ?? "USD",
		timeFormat: company?.timeFormat ?? DEFAULT_COMPANY_DATETIME.timeFormat,
		timezone: company?.timezone ?? DEFAULT_COMPANY_DATETIME.timezone,
		uiLocale: (company?.uiLocale ?? DEFAULT_UI_LOCALE_PREFERENCE) as UiLocalePreference,
		companyName: company?.companyName?.trim() || "Beacon",
		inviteEmailDomains: Array.isArray(company?.inviteEmailDomains)
			? company.inviteEmailDomains.filter((d): d is string => typeof d === "string" && d.length > 0)
			: [],
		emailProposedMemories: company?.emailProposedMemories ?? true,
		emailDailyDigest: company?.emailDailyDigest ?? false,
		emailTeamInvites: company?.emailTeamInvites ?? true,
		emailBilling: company?.emailBilling ?? true,
	};
}

export function useCompanySettings() {
	const { request } = useAppAuth();
	return useQuery({
		queryKey: ["company-settings"],
		queryFn: async () => {
			const data = await request<{ company: CompanySettings }>("/company");
			return normalizeCompanySettings(data.company);
		},
	});
}

/** Prefer per-user account prefs; fall back to company defaults. */
export function useResolvedDateTimePrefs(): ResolvedDateTimePrefs {
	const { user } = useAppAuth();
	const { data } = useCompanySettings();
	return resolveDateTimePrefs({
		timeFormat: (user?.timeFormat ?? data?.timeFormat ?? "auto") as TimeFormatPreference,
		timezone: user?.timezone ?? data?.timezone ?? "auto",
	});
}

export function useDisplayCurrency(): string {
	const { user } = useAppAuth();
	const { data } = useCompanySettings();
	return user?.displayCurrency ?? data?.displayCurrency ?? "USD";
}

export function formatWithPrefs(
	iso: string,
	prefs: ResolvedDateTimePrefs,
	options?: Intl.DateTimeFormatOptions,
): string {
	return formatAppDateTime(iso, prefs, options);
}
