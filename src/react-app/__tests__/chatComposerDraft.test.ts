import {
	chatComposerDraftKey,
	clearChatComposerDraft,
	initialChatComposerInput,
	readChatComposerContext,
	readChatComposerDraft,
	writeChatComposerContext,
	writeChatComposerDraft,
} from "../chatComposerDraft";

function installLocalStorage() {
	const store = new Map<string, string>();
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, String(value));
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => {
				store.clear();
			},
		},
	});
}

describe("chatComposerDraft", () => {
	beforeEach(() => {
		installLocalStorage();
		localStorage.clear();
	});

	it("keys drafts by scope and conversation", () => {
		expect(chatComposerDraftKey("personal", null)).toBe("lumantic-chat-composer-draft:personal:new");
		expect(chatComposerDraftKey("global", 42)).toBe("lumantic-chat-composer-draft:global:42");
	});

	it("round-trips draft text", () => {
		const key = chatComposerDraftKey("personal", null);
		writeChatComposerDraft(key, "hello");
		expect(readChatComposerDraft(key)).toBe("hello");
		clearChatComposerDraft(key);
		expect(readChatComposerDraft(key)).toBe("");
	});

	it("round-trips composer context and initial input", () => {
		writeChatComposerContext({ scope: "personal", draftNew: true, conversationId: null });
		writeChatComposerDraft(chatComposerDraftKey("personal", null), "draft body");
		const ctx = readChatComposerContext();
		expect(ctx).toEqual({ scope: "personal", draftNew: true, conversationId: null });
		expect(initialChatComposerInput(ctx)).toBe("draft body");
	});
});
