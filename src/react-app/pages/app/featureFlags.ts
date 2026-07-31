import { useSyncExternalStore } from "react";

export type FeatureFlagKey = "exampleDevBanner";

type FeatureFlagDef = {
	key: FeatureFlagKey;
	label: string;
	description: string;
	defaultValue: boolean;
};

/** Flags listed under Cmd+K → Dev only (dev builds only; stripped from production). */
export const FEATURE_FLAG_DEFS: readonly FeatureFlagDef[] = [
	{
		key: "exampleDevBanner",
		label: "Chat banner",
		description: "Shows a sample banner at the top of Chat",
		defaultValue: false,
	},
] as const;

const STORAGE_KEY = "lumantic-feature-flags";

type FlagState = Partial<Record<FeatureFlagKey, boolean>>;

const listeners = new Set<() => void>();

function isDev() {
	return import.meta.env.DEV;
}

function readStorage(): FlagState {
	if (!isDev()) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as FlagState;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

let cache: FlagState | null = null;

function getSnapshot(): FlagState {
	if (cache) return cache;
	cache = readStorage();
	return cache;
}

function writeStorage(next: FlagState) {
	cache = next;
	if (isDev()) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// ignore quota / private mode
		}
	}
	listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getFeatureFlag(key: FeatureFlagKey): boolean {
	const def = FEATURE_FLAG_DEFS.find((f) => f.key === key);
	const fallback = def?.defaultValue ?? false;
	if (!isDev()) return fallback;
	const value = getSnapshot()[key];
	return typeof value === "boolean" ? value : fallback;
}

export function setFeatureFlag(key: FeatureFlagKey, enabled: boolean) {
	if (!isDev()) return;
	writeStorage({ ...getSnapshot(), [key]: enabled });
}

export function toggleFeatureFlag(key: FeatureFlagKey) {
	setFeatureFlag(key, !getFeatureFlag(key));
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
	return useSyncExternalStore(
		subscribe,
		() => getFeatureFlag(key),
		() => {
			const def = FEATURE_FLAG_DEFS.find((f) => f.key === key);
			return def?.defaultValue ?? false;
		},
	);
}

/** Re-render when any flag changes (for Cmd+K list hints). */
export function useFeatureFlagSnapshot(): FlagState {
	return useSyncExternalStore(subscribe, getSnapshot, () => ({}));
}

export function featureFlagsEnabled() {
	return isDev();
}
