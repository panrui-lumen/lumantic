import {
	INPUT_USD_PER_MTOK,
	OUTPUT_USD_PER_MTOK,
	costUsdFromTokens,
	estimateReplyUsage,
	estimateTokens,
	formatLatencyMs,
	formatTokenCount,
	totalTokens,
} from "../usage";

describe("estimateTokens", () => {
	it("estimates about one token per four characters", () => {
		expect(estimateTokens("abcd")).toBe(1);
		expect(estimateTokens("abcdefgh")).toBe(2);
		expect(estimateTokens("a".repeat(9))).toBe(3);
	});

	it("returns at least 1 for empty or whitespace input", () => {
		expect(estimateTokens("")).toBe(1);
		expect(estimateTokens("   ")).toBe(1);
	});

	it("trims before measuring", () => {
		expect(estimateTokens("  abcd  ")).toBe(1);
	});
});

describe("costUsdFromTokens", () => {
	it("prices input and output at the demo rates", () => {
		const input = 1_000_000;
		const output = 1_000_000;
		expect(costUsdFromTokens(input, output)).toBe(INPUT_USD_PER_MTOK + OUTPUT_USD_PER_MTOK);
	});

	it("rounds to six decimal places", () => {
		expect(costUsdFromTokens(420, 100)).toBe(0.00276);
	});
});

describe("estimateReplyUsage", () => {
	it("adds system overhead to input tokens", () => {
		const usage = estimateReplyUsage("abcd", "abcdefgh");
		expect(usage.inputTokens).toBe(420 + 1);
		expect(usage.outputTokens).toBe(2);
		expect(usage.costUsd).toBe(costUsdFromTokens(usage.inputTokens, usage.outputTokens));
		expect(usage.latencyMs).toBeGreaterThan(5000);
	});
});

describe("formatLatencyMs", () => {
	it("formats milliseconds and seconds", () => {
		expect(formatLatencyMs(840)).toBe("840ms");
		expect(formatLatencyMs(5200)).toBe("5.2s");
		expect(formatLatencyMs(12500)).toBe("13s");
	});
});

describe("totalTokens", () => {
	it("sums input and output", () => {
		expect(totalTokens({ inputTokens: 10, outputTokens: 5 })).toBe(15);
	});
});

describe("formatTokenCount", () => {
	it("formats with locale separators", () => {
		expect(formatTokenCount(1240)).toBe((1240).toLocaleString());
	});
});
