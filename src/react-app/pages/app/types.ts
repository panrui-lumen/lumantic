export type AppUser = {
	username: string;
	name: string;
	role: string;
	company: string;
};

export type SlackChannel = {
	id: string;
	name: string;
	is_private: number;
};

export type SlackSettings = {
	connected: boolean;
	workspaceName: string | null;
	botName: string;
	defaultChannelId: string | null;
	defaultChannelName: string | null;
	postProposedMemories: boolean;
	postDailyDigest: boolean;
	notifyOnNewMemory: boolean;
	updatedAt: string;
};

export type Memory = {
	id: number;
	content: string;
	category: string;
	source: string;
	created_at: string;
	updated_at: string;
};

export type ProposedMemory = {
	id: number;
	content: string;
	category: string;
	source: string;
	confidence: number;
	created_at: string;
};

export type Conversation = {
	id: number;
	title: string;
	scope?: "personal" | "global";
	author_name?: string | null;
	pinned?: number;
	archived?: number;
	created_at: string;
	updated_at: string;
};

export type ChatMessage = {
	id: number;
	role: "user" | "assistant";
	content: string;
	suggested_memory: string | null;
	artifact?: string | null;
	working?: string | null;
	created_at: string;
};

export const MEMORY_CATEGORIES = ["general", "definition", "gotcha", "business-rule", "insight"] as const;
