import {
	fetchRemoteBuildId,
	isChunkLoadFailure,
	isRemoteBuildNewer,
	parseVersionPayload,
} from "../../react-app/appVersion";
import { resolveAppBuildId } from "../../../scripts/vite-app-version-plugin";

describe("parseVersionPayload", () => {
	it("reads a non-empty buildId", () => {
		expect(parseVersionPayload({ buildId: " abc123 " })).toBe("abc123");
	});

	it("rejects missing or empty values", () => {
		expect(parseVersionPayload(null)).toBeNull();
		expect(parseVersionPayload({})).toBeNull();
		expect(parseVersionPayload({ buildId: "" })).toBeNull();
		expect(parseVersionPayload({ buildId: 12 })).toBeNull();
	});
});

describe("isRemoteBuildNewer", () => {
	it("is true only when both ids are set and differ", () => {
		expect(isRemoteBuildNewer("a", "b")).toBe(true);
		expect(isRemoteBuildNewer("a", "a")).toBe(false);
		expect(isRemoteBuildNewer("", "b")).toBe(false);
		expect(isRemoteBuildNewer("a", "")).toBe(false);
	});
});

describe("isChunkLoadFailure", () => {
	it("matches common dynamic import failure messages", () => {
		expect(isChunkLoadFailure(new Error("Failed to fetch dynamically imported module"))).toBe(true);
		expect(isChunkLoadFailure("ChunkLoadError: Loading chunk 3 failed")).toBe(true);
		expect(isChunkLoadFailure(new Error("network timeout"))).toBe(false);
	});
});

describe("fetchRemoteBuildId", () => {
	it("returns the remote build id", async () => {
		const fetchImpl = jest.fn(async () => ({
			ok: true,
			json: async () => ({ buildId: "remote-1" }),
		})) as unknown as typeof fetch;
		await expect(fetchRemoteBuildId(fetchImpl)).resolves.toBe("remote-1");
	});

	it("returns null on failure", async () => {
		const fetchImpl = jest.fn(async () => {
			throw new Error("offline");
		}) as unknown as typeof fetch;
		await expect(fetchRemoteBuildId(fetchImpl)).resolves.toBeNull();
	});
});

describe("resolveAppBuildId", () => {
	it("prefers CI commit SHAs", () => {
		expect(resolveAppBuildId({ GITHUB_SHA: "abcdef0123456789" })).toBe("abcdef012345");
	});

	it("falls back to a dev timestamp id", () => {
		expect(resolveAppBuildId({})).toMatch(/^dev-\d+$/);
	});
});
