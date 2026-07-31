/** Clamp a 1-based page number from query/input. */
export function clampPage(raw: string | number | null | undefined, fallback = 1): number {
	const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	return Math.floor(n);
}

/** Clamp a page size from query/input. */
export function clampPageSize(raw: string | number | null | undefined, fallback = 20, max = 100): number {
	const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	return Math.min(max, Math.floor(n));
}

/** Clamp a positive limit (e.g. message page size). */
export function clampLimit(raw: string | number | null | undefined, fallback = 40, max = 100): number {
	return clampPageSize(raw, fallback, max);
}
