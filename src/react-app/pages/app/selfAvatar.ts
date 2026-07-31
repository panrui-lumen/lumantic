import { useSyncExternalStore } from "react";

type SelfAvatarState = {
	name: string | null;
	avatarUrl: string | null;
};

let state: SelfAvatarState = { name: null, avatarUrl: null };
const listeners = new Set<() => void>();

function emit() {
	listeners.forEach((l) => l());
}

export function setSelfAvatar(next: SelfAvatarState) {
	state = next;
	emit();
}

export function getSelfAvatar() {
	return state;
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useSelfAvatar() {
	return useSyncExternalStore(subscribe, getSelfAvatar, () => ({ name: null, avatarUrl: null }));
}
