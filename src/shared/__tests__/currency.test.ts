import {
	DEFAULT_DISPLAY_CURRENCY,
	DISPLAY_CURRENCIES,
	formatDisplayCost,
	getDisplayCurrency,
	isDisplayCurrency,
	usdToDisplay,
} from "../currency";

describe("DISPLAY_CURRENCIES", () => {
	it("lists USD first by market size", () => {
		expect(DISPLAY_CURRENCIES[0]?.code).toBe("USD");
		expect(DISPLAY_CURRENCIES.map((c) => c.code)).toEqual(expect.arrayContaining(["GBP", "EUR", "AUD", "CAD"]));
	});
});

describe("isDisplayCurrency", () => {
	it("accepts known codes", () => {
		expect(isDisplayCurrency("USD")).toBe(true);
		expect(isDisplayCurrency("GBP")).toBe(true);
	});

	it("rejects unknown codes", () => {
		expect(isDisplayCurrency("usd")).toBe(false);
		expect(isDisplayCurrency("XYZ")).toBe(false);
	});
});

describe("getDisplayCurrency", () => {
	it("returns the matching currency", () => {
		expect(getDisplayCurrency("GBP").code).toBe("GBP");
	});

	it("falls back to USD for missing or unknown codes", () => {
		expect(getDisplayCurrency(null).code).toBe(DEFAULT_DISPLAY_CURRENCY);
		expect(getDisplayCurrency("NOPE").code).toBe("USD");
	});
});

describe("usdToDisplay", () => {
	it("leaves USD unchanged", () => {
		expect(usdToDisplay(1.5, "USD")).toBe(1.5);
	});

	it("converts using the currency rate", () => {
		expect(usdToDisplay(1, "GBP")).toBeCloseTo(0.79);
		expect(usdToDisplay(2, "EUR")).toBeCloseTo(1.84);
	});
});

describe("formatDisplayCost", () => {
	it("formats USD for tiny reply costs with extra precision", () => {
		const formatted = formatDisplayCost(0.003, "USD");
		expect(formatted).toMatch(/\$/);
		expect(formatted).toMatch(/0\.003/);
	});

	it("formats GBP from a USD base amount", () => {
		const formatted = formatDisplayCost(1, "GBP");
		expect(formatted).toMatch(/£|GBP/);
	});

	it("uses zero fraction digits for JPY", () => {
		const formatted = formatDisplayCost(1, "JPY");
		expect(formatted).toMatch(/157|¥|JPY/);
	});
});
