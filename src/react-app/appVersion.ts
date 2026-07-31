export type VersionPayload = {
	buildId: string;
};

const CHUNK_LOAD_ERROR =
	/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

export function parseVersionPayload(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const buildId = (data as { buildId?: unknown }).buildId;
	if (typeof buildId !== "string") return null;
	const trimmed = buildId.trim();
	return trimmed || null;
}

export function isRemoteBuildNewer(currentBuildId: string, remoteBuildId: string): boolean {
	return Boolean(currentBuildId && remoteBuildId && currentBuildId !== remoteBuildId);
}

export function isChunkLoadFailure(reason: unknown): boolean {
	if (reason == null) return false;
	if (typeof reason === "string") return CHUNK_LOAD_ERROR.test(reason);
	if (reason instanceof Error) return CHUNK_LOAD_ERROR.test(reason.message);
	if (typeof reason === "object" && "message" in reason) {
		return CHUNK_LOAD_ERROR.test(String((reason as { message: unknown }).message));
	}
	return CHUNK_LOAD_ERROR.test(String(reason));
}

export async function fetchRemoteBuildId(
	fetchImpl: typeof fetch = fetch,
	url = "/version.json",
): Promise<string | null> {
	try {
		const separator = url.includes("?") ? "&" : "?";
		const res = await fetchImpl(`${url}${separator}_=${Date.now()}`, {
			cache: "no-store",
			headers: { Accept: "application/json" },
		});
		if (!res.ok) return null;
		return parseVersionPayload(await res.json());
	} catch {
		return null;
	}
}
