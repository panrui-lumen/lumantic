/** Workspace date/time display preferences. */

export const TIME_FORMATS = ["auto", "12h", "24h"] as const;
export type TimeFormatPreference = (typeof TIME_FORMATS)[number];
export type ResolvedTimeFormat = "12h" | "24h";

export type CompanyDateTimeSettings = {
	timeFormat: TimeFormatPreference;
	/** `auto` or an IANA timezone id (for example `Europe/London`). */
	timezone: string;
};

export type ResolvedDateTimePrefs = {
	timeFormat: ResolvedTimeFormat;
	timeZone: string;
};

const TIMEZONE_RE = /^[A-Za-z0-9_+\-/]+$/;

/** Curated fallback when `Intl.supportedValuesOf("timeZone")` is unavailable. */
export const COMMON_TIMEZONES = [
	"UTC",
	"Pacific/Honolulu",
	"America/Anchorage",
	"America/Los_Angeles",
	"America/Denver",
	"America/Chicago",
	"America/New_York",
	"America/Toronto",
	"America/Sao_Paulo",
	"Atlantic/Reykjavik",
	"Europe/London",
	"Europe/Dublin",
	"Europe/Paris",
	"Europe/Berlin",
	"Europe/Amsterdam",
	"Europe/Madrid",
	"Europe/Rome",
	"Europe/Stockholm",
	"Europe/Warsaw",
	"Europe/Istanbul",
	"Africa/Cairo",
	"Africa/Johannesburg",
	"Asia/Dubai",
	"Asia/Karachi",
	"Asia/Kolkata",
	"Asia/Bangkok",
	"Asia/Singapore",
	"Asia/Hong_Kong",
	"Asia/Shanghai",
	"Asia/Tokyo",
	"Asia/Seoul",
	"Australia/Perth",
	"Australia/Sydney",
	"Pacific/Auckland",
] as const;

export function isTimeFormatPreference(value: string): value is TimeFormatPreference {
	return (TIME_FORMATS as readonly string[]).includes(value);
}

export function isTimezonePreference(value: string): boolean {
	if (value === "auto") return true;
	if (!TIMEZONE_RE.test(value) || value.length > 64) return false;
	try {
		Intl.DateTimeFormat(undefined, { timeZone: value });
		return true;
	} catch {
		return false;
	}
}

export function detectBrowserTimeFormat(): ResolvedTimeFormat {
	try {
		const hourCycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
		if (hourCycle === "h11" || hourCycle === "h12") return "12h";
		if (hourCycle === "h23" || hourCycle === "h24") return "24h";
	} catch {
		/* fall through */
	}
	try {
		const sample = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(new Date(2024, 0, 1, 13));
		const dayPeriod = sample.some((part) => part.type === "dayPeriod");
		return dayPeriod ? "12h" : "24h";
	} catch {
		return "12h";
	}
}

export function detectBrowserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}

export function resolveTimeFormat(pref: TimeFormatPreference): ResolvedTimeFormat {
	return pref === "auto" ? detectBrowserTimeFormat() : pref;
}

export function resolveTimezone(pref: string): string {
	if (!pref || pref === "auto") return detectBrowserTimezone();
	return isTimezonePreference(pref) ? pref : detectBrowserTimezone();
}

export function resolveDateTimePrefs(settings: CompanyDateTimeSettings): ResolvedDateTimePrefs {
	return {
		timeFormat: resolveTimeFormat(settings.timeFormat),
		timeZone: resolveTimezone(settings.timezone),
	};
}

export function listTimeZones(): string[] {
	try {
		const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone");
		if (supported && supported.length > 0) return [...supported];
	} catch {
		/* fall through */
	}
	return [...COMMON_TIMEZONES];
}

function parseAppDate(input: string | number | Date): Date | null {
	const date =
		typeof input === "number"
			? new Date(input)
			: input instanceof Date
				? input
				: new Date(input.endsWith("Z") ? input : `${input}Z`);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAppDateTime(
	input: string | number | Date,
	prefs: ResolvedDateTimePrefs,
	options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
	const date = parseAppDate(input);
	if (!date) return "";
	return date.toLocaleString(undefined, {
		...options,
		timeZone: prefs.timeZone,
		hour12: prefs.timeFormat === "12h",
	});
}

export function formatAppDate(
	input: string | number | Date,
	prefs: ResolvedDateTimePrefs,
	options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
	const date = parseAppDate(input);
	if (!date) return "";
	return date.toLocaleDateString(undefined, {
		...options,
		timeZone: prefs.timeZone,
	});
}

export const DEFAULT_COMPANY_DATETIME: CompanyDateTimeSettings = {
	timeFormat: "auto",
	timezone: "auto",
};
