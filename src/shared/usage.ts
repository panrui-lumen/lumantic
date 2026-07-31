/** Demo model rates (USD per 1M tokens), Sonnet-class ballpark. */
export const INPUT_USD_PER_MTOK = 3;
export const OUTPUT_USD_PER_MTOK = 15;

/** Matches the chat thinking animation phase count × phase duration in the app UI. */
export const DEMO_REPLY_LATENCY_BASE_MS = 6 * 850;

export type ReplyUsage = {
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
	latencyMs: number;
};

/** Rough token estimate for demo replies (~4 chars per token). */
export function estimateTokens(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 1;
	return Math.max(1, Math.ceil(trimmed.length / 4));
}

export function costUsdFromTokens(inputTokens: number, outputTokens: number): number {
	const usd = (inputTokens / 1_000_000) * INPUT_USD_PER_MTOK + (outputTokens / 1_000_000) * OUTPUT_USD_PER_MTOK;
	return Math.round(usd * 1_000_000) / 1_000_000;
}

/** Deterministic demo latency so replies feel like the thinking pipeline took real time. */
export function estimateReplyLatencyMs(userText: string, assistantText: string): number {
	const extra = Math.min(2800, Math.floor(estimateTokens(assistantText) * 1.5 + estimateTokens(userText) * 0.25));
	return DEMO_REPLY_LATENCY_BASE_MS + extra;
}

/** Deterministic demo usage for an assistant reply given the prompting user text. */
export function estimateReplyUsage(userText: string, assistantText: string): ReplyUsage {
	const systemOverhead = 420;
	const inputTokens = systemOverhead + estimateTokens(userText);
	const outputTokens = estimateTokens(assistantText);
	return {
		inputTokens,
		outputTokens,
		costUsd: costUsdFromTokens(inputTokens, outputTokens),
		latencyMs: estimateReplyLatencyMs(userText, assistantText),
	};
}

export function totalTokens(usage: Pick<ReplyUsage, "inputTokens" | "outputTokens">): number {
	return usage.inputTokens + usage.outputTokens;
}

export function formatTokenCount(n: number): string {
	return n.toLocaleString();
}

/** Format reply latency for dense chat metadata (e.g. 5.2s, 840ms). */
export function formatLatencyMs(ms: number): string {
	if (!Number.isFinite(ms) || ms < 0) return "";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const seconds = ms / 1000;
	if (seconds < 10) return `${seconds.toFixed(1)}s`;
	return `${Math.round(seconds)}s`;
}
