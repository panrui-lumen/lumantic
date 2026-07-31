import {
	DEFAULT_COMPANY_DATETIME,
	formatAppDateTime,
	resolveDateTimePrefs,
	type ResolvedDateTimePrefs,
	type TimeFormatPreference,
} from "../../../shared/datetime";
import type { CompanySettings } from "./types";
import { useQuery } from "@tanstack/react-query";
import { useAppAuth } from "./context";

export function normalizeCompanySettings(company: Partial<CompanySettings> | null | undefined): CompanySettings {
	return {
		displayCurrency: company?.displayCurrency ?? "USD",
		timeFormat: company?.timeFormat ?? DEFAULT_COMPANY_DATETIME.timeFormat,
		timezone: company?.timezone ?? DEFAULT_COMPANY_DATETIME.timezone,
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

export function useResolvedDateTimePrefs(): ResolvedDateTimePrefs {
	const { data } = useCompanySettings();
	return resolveDateTimePrefs({
		timeFormat: (data?.timeFormat ?? "auto") as TimeFormatPreference,
		timezone: data?.timezone ?? "auto",
	});
}

export function formatWithPrefs(
	iso: string,
	prefs: ResolvedDateTimePrefs,
	options?: Intl.DateTimeFormatOptions,
): string {
	return formatAppDateTime(iso, prefs, options);
}
