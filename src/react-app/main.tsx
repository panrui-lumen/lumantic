import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { startAppUpdateWatcher } from "./appUpdateWatcher";

// Prompt a reload when a newer deploy is live (or a stale chunk fails to load).
startAppUpdateWatcher({
	currentBuildId: import.meta.env.VITE_APP_BUILD_ID ?? "",
});

const container = document.getElementById("root")!;

// "/" is server-rendered by the Worker, so it must be hydrated rather than re-rendered
// from scratch. Every other route (e.g. "/admin") gets an empty shell and mounts fresh.
if (container.hasChildNodes()) {
	hydrateRoot(
		container,
		<StrictMode>
			<App />
		</StrictMode>,
	);
} else {
	createRoot(container).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
