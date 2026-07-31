import {
	DEFAULT_COMPANY_DATETIME,
	detectBrowserTimeFormat,
	detectBrowserTimezone,
	formatAppDateTime,
	isTimeFormatPreference,
	listTimeZones,
	resolveDateTimePrefs,
	type TimeFormatPreference,
} from "../datetime";

describe("datetime prefs", () => {
	it("accepts time format preferences", () => {
		expect(isTimeFormatPreference("auto")).toBe(true);
		expect(isTimeFormatPreference("12h")).toBe(true);
		expect(isTimeFormatPreference("24h")).toBe(true);
		expect(isTimeFormatPreference("36h")).toBe(false);
	});

	it("resolves auto to a concrete format and timezone", () => {
		const resolved = resolveDateTimePrefs(DEFAULT_COMPANY_DATETIME);
		expect(resolved.timeFormat === "12h" || resolved.timeFormat === "24h").toBe(true);
		expect(resolved.timeZone.length).toBeGreaterThan(0);
	});

	it("formats with explicit 24h and UTC", () => {
		const text = formatAppDateTime(
			"2026-07-31T15:30:00Z",
			{ timeFormat: "24h", timeZone: "UTC" },
			{ hour: "2-digit", minute: "2-digit", hour12: false },
		);
		expect(text.replace(/\s/g, "")).toMatch(/15:30/);
	});

	it("lists at least the curated timezones", () => {
		const zones = listTimeZones();
		expect(zones.length).toBeGreaterThan(10);
		expect(zones.some((z) => z === "UTC" || z === "Etc/UTC" || z.includes("London"))).toBe(true);
	});

	it("detects browser helpers without throwing", () => {
		expect(["12h", "24h"]).toContain(detectBrowserTimeFormat());
		expect(typeof detectBrowserTimezone()).toBe("string");
	});
});
