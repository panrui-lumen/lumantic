export type ChatComposerScope = "personal" | "global";

const DRAFT_PREFIX = "lumantic-chat-composer-draft:";
const CONTEXT_KEY = "lumantic-chat-composer-context";

export type ChatComposerContext = {
	scope: ChatComposerScope;
	draftNew: boolean;
	/** Active conversation id when not drafting a new chat. */
	conversationId: number | null;
};

export function chatComposerDraftKey(scope: ChatComposerScope, conversationId: number | null): string {
	return `${DRAFT_PREFIX}${scope}:${conversationId ?? "new"}`;
}

export function readChatComposerDraft(key: string): string {
	try {
		return localStorage.getItem(key) ?? "";
	} catch {
		return "";
	}
}

export function writeChatComposerDraft(key: string, value: string): void {
	try {
		const trimmed = value; // preserve intentional whitespace while typing
		if (!trimmed) localStorage.removeItem(key);
		else localStorage.setItem(key, trimmed);
	} catch {
		// ignore quota / private mode
	}
}

export function clearChatComposerDraft(key: string): void {
	writeChatComposerDraft(key, "");
}

export function readChatComposerContext(): ChatComposerContext | null {
	try {
		const raw = localStorage.getItem(CONTEXT_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<ChatComposerContext>;
		if (parsed.scope !== "personal" && parsed.scope !== "global") return null;
		const conversationId =
			typeof parsed.conversationId === "number" && Number.isFinite(parsed.conversationId)
				? parsed.conversationId
				: null;
		return {
			scope: parsed.scope,
			draftNew: Boolean(parsed.draftNew),
			conversationId: parsed.draftNew ? null : conversationId,
		};
	} catch {
		return null;
	}
}

export function writeChatComposerContext(ctx: ChatComposerContext): void {
	try {
		localStorage.setItem(
			CONTEXT_KEY,
			JSON.stringify({
				scope: ctx.scope,
				draftNew: ctx.draftNew,
				conversationId: ctx.draftNew ? null : ctx.conversationId,
			} satisfies ChatComposerContext),
		);
	} catch {
		// ignore
	}
}

/** Initial composer text for the stored (or default) chat context. */
export function initialChatComposerInput(ctx: ChatComposerContext | null): string {
	if (!ctx) return "";
	const key = chatComposerDraftKey(ctx.scope, ctx.draftNew ? null : ctx.conversationId);
	return readChatComposerDraft(key);
}
