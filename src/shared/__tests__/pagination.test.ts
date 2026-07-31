import { clampLimit, clampPage, clampPageSize } from "../pagination";

describe("clampPage", () => {
	it("defaults invalid values to fallback", () => {
		expect(clampPage(undefined)).toBe(1);
		expect(clampPage("")).toBe(1);
		expect(clampPage("nope")).toBe(1);
		expect(clampPage(0)).toBe(1);
		expect(clampPage(-3)).toBe(1);
	});

	it("floors positive numbers", () => {
		expect(clampPage("2")).toBe(2);
		expect(clampPage(3.9)).toBe(3);
	});
});

describe("clampPageSize", () => {
	it("defaults and caps", () => {
		expect(clampPageSize(undefined)).toBe(20);
		expect(clampPageSize(0)).toBe(20);
		expect(clampPageSize(500)).toBe(100);
		expect(clampPageSize("12")).toBe(12);
	});
});

describe("clampLimit", () => {
	it("uses message-oriented defaults", () => {
		expect(clampLimit(undefined)).toBe(40);
		expect(clampLimit(200)).toBe(100);
		expect(clampLimit("25")).toBe(25);
	});
});
