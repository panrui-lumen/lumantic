/** Display currencies ordered by approximate FX / SaaS market size (largest first). */
export const DISPLAY_CURRENCIES = [
	{ code: "USD", name: "US Dollar", symbol: "$", perUsd: 1 },
	{ code: "EUR", name: "Euro", symbol: "€", perUsd: 0.92 },
	{ code: "JPY", name: "Japanese Yen", symbol: "¥", perUsd: 157 },
	{ code: "GBP", name: "British Pound", symbol: "£", perUsd: 0.79 },
	{ code: "CNY", name: "Chinese Yuan", symbol: "¥", perUsd: 7.25 },
	{ code: "AUD", name: "Australian Dollar", symbol: "A$", perUsd: 1.54 },
	{ code: "CAD", name: "Canadian Dollar", symbol: "C$", perUsd: 1.37 },
	{ code: "CHF", name: "Swiss Franc", symbol: "CHF", perUsd: 0.88 },
	{ code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", perUsd: 7.82 },
	{ code: "SGD", name: "Singapore Dollar", symbol: "S$", perUsd: 1.34 },
	{ code: "SEK", name: "Swedish Krona", symbol: "kr", perUsd: 10.8 },
	{ code: "KRW", name: "South Korean Won", symbol: "₩", perUsd: 1380 },
	{ code: "NOK", name: "Norwegian Krone", symbol: "kr", perUsd: 10.9 },
	{ code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", perUsd: 1.68 },
	{ code: "INR", name: "Indian Rupee", symbol: "₹", perUsd: 83.5 },
	{ code: "MXN", name: "Mexican Peso", symbol: "MX$", perUsd: 17.2 },
	{ code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", perUsd: 32.3 },
	{ code: "ZAR", name: "South African Rand", symbol: "R", perUsd: 18.5 },
	{ code: "BRL", name: "Brazilian Real", symbol: "R$", perUsd: 5.1 },
	{ code: "DKK", name: "Danish Krone", symbol: "kr", perUsd: 6.9 },
	{ code: "PLN", name: "Polish Zloty", symbol: "zł", perUsd: 4.0 },
	{ code: "THB", name: "Thai Baht", symbol: "฿", perUsd: 36.5 },
	{ code: "ILS", name: "Israeli Shekel", symbol: "₪", perUsd: 3.7 },
	{ code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", perUsd: 16200 },
	{ code: "CZK", name: "Czech Koruna", symbol: "Kč", perUsd: 23.2 },
	{ code: "AED", name: "UAE Dirham", symbol: "د.إ", perUsd: 3.67 },
	{ code: "TRY", name: "Turkish Lira", symbol: "₺", perUsd: 34.0 },
	{ code: "HUF", name: "Hungarian Forint", symbol: "Ft", perUsd: 365 },
	{ code: "CLP", name: "Chilean Peso", symbol: "CLP$", perUsd: 950 },
	{ code: "SAR", name: "Saudi Riyal", symbol: "﷼", perUsd: 3.75 },
	{ code: "PHP", name: "Philippine Peso", symbol: "₱", perUsd: 58 },
	{ code: "MYR", name: "Malaysian Ringgit", symbol: "RM", perUsd: 4.7 },
	{ code: "COP", name: "Colombian Peso", symbol: "COL$", perUsd: 4100 },
	{ code: "RON", name: "Romanian Leu", symbol: "lei", perUsd: 4.6 },
] as const;

export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCIES)[number]["code"];

const BY_CODE = new Map(DISPLAY_CURRENCIES.map((c) => [c.code, c]));

export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrencyCode = "USD";

export function isDisplayCurrency(code: string): code is DisplayCurrencyCode {
	return BY_CODE.has(code as DisplayCurrencyCode);
}

export function getDisplayCurrency(code: string | null | undefined) {
	if (code && isDisplayCurrency(code)) return BY_CODE.get(code)!;
	return BY_CODE.get(DEFAULT_DISPLAY_CURRENCY)!;
}

/** Convert a USD amount into the company's display currency. */
export function usdToDisplay(amountUsd: number, currencyCode: string): number {
	const currency = getDisplayCurrency(currencyCode);
	return amountUsd * currency.perUsd;
}

/** Format a USD cost in the company's display currency. */
export function formatDisplayCost(amountUsd: number, currencyCode: string): string {
	const currency = getDisplayCurrency(currencyCode);
	const local = usdToDisplay(amountUsd, currency.code);
	const zeroDecimal = new Set(["JPY", "KRW", "IDR", "HUF", "CLP", "COP", "VND"]);
	const fractionDigits = zeroDecimal.has(currency.code) ? 0 : local < 0.01 ? 4 : local < 1 ? 3 : 2;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: currency.code,
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(local);
	} catch {
		return `${currency.symbol}${local.toFixed(fractionDigits)}`;
	}
}
