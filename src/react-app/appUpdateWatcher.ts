import { toast } from "sonner";
import i18n from "./pages/app/i18n-instance";
import { fetchRemoteBuildId, isChunkLoadFailure, isRemoteBuildNewer } from "./appVersion";

export const APP_UPDATE_TOAST_ID = "app-update";

const DEFAULT_INTERVAL_MS = 60_000;

export type AppUpdateWatcherOptions = {
	currentBuildId?: string;
	intervalMs?: number;
	fetchImpl?: typeof fetch;
	reload?: () => void;
};

/** Show the sticky "site updated, please reload" toast (re-shows if already open). */
export function promptAppUpdateToast(reload: () => void = () => window.location.reload()) {
	// Same id replaces an existing toast; avoid dismiss()+create which can animate the new toast out.
	toast(i18n.t("update.available"), {
		id: APP_UPDATE_TOAST_ID,
		duration: Infinity,
		closeButton: true,
		action: {
			label: i18n.t("update.reload"),
			onClick: reload,
		},
	});
}

/**
 * Poll `/version.json` (and listen for chunk-load failures) so open /app tabs
 * can prompt the user to reload after a deploy. Start this from AppPage only.
 */
export function startAppUpdateWatcher(options: AppUpdateWatcherOptions = {}): () => void {
	const currentBuildId = options.currentBuildId ?? "";
	const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
	const fetchImpl = options.fetchImpl ?? fetch;
	const reload = options.reload ?? (() => window.location.reload());

	if (!currentBuildId) return () => {};

	let prompted = false;
	let disposed = false;

	function promptOnce() {
		if (disposed || prompted) return;
		prompted = true;
		promptAppUpdateToast(reload);
	}

	async function check() {
		if (disposed || prompted) return;
		const remote = await fetchRemoteBuildId(fetchImpl);
		if (disposed || prompted) return;
		if (remote && isRemoteBuildNewer(currentBuildId, remote)) {
			promptOnce();
		}
	}

	void check();
	const timer = window.setInterval(() => {
		void check();
	}, intervalMs);

	const onVisibility = () => {
		if (document.visibilityState === "visible") void check();
	};
	document.addEventListener("visibilitychange", onVisibility);

	const onRejection = (event: PromiseRejectionEvent) => {
		if (isChunkLoadFailure(event.reason)) promptOnce();
	};
	window.addEventListener("unhandledrejection", onRejection);

	return () => {
		disposed = true;
		window.clearInterval(timer);
		document.removeEventListener("visibilitychange", onVisibility);
		window.removeEventListener("unhandledrejection", onRejection);
	};
}
