export const OPEN_USER_PROFILE_EVENT = "lumantic-open-user-profile";

export type UserProfileDetail = {
	name: string;
	email?: string | null;
	role?: string | null;
	status?: "active" | "invited" | null;
	subtitle?: string | null;
};

/** Demo directory so profiles work even when team API isn't loaded (e.g. public share pages). */
export const KNOWN_PROFILES: Record<string, UserProfileDetail> = {
	"avery chen": {
		name: "Avery Chen",
		email: "avery@beacon.com",
		role: "Owner",
		status: "active",
		subtitle: "Head of Data at Beacon",
	},
	"priya nair": {
		name: "Priya Nair",
		email: "priya@beacon.com",
		role: "Admin",
		status: "active",
		subtitle: "Data Platform",
	},
	"sam rivera": {
		name: "Sam Rivera",
		email: "sam@beacon.com",
		role: "Member",
		status: "active",
		subtitle: "Product Analytics",
	},
	"jordan lee": {
		name: "Jordan Lee",
		email: "jordan@beacon.com",
		role: "Member",
		status: "invited",
		subtitle: "Invited to Beacon",
	},
	lumantic: {
		name: "Lumantic",
		email: null,
		role: "AI analyst",
		status: "active",
		subtitle: "Workspace AI that learns from your team's chats and memories",
	},
};

export function normalizeProfileName(name: string) {
	return name.trim().toLowerCase();
}

export function lookupKnownProfile(name: string): UserProfileDetail | null {
	const key = normalizeProfileName(name);
	if (!key || key === "you") return null;
	return KNOWN_PROFILES[key] ?? null;
}

export function openUserProfile(name: string) {
	const trimmed = name.trim();
	if (!trimmed) return;
	window.dispatchEvent(new CustomEvent(OPEN_USER_PROFILE_EVENT, { detail: { name: trimmed } }));
}
