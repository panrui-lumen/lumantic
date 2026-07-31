import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

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
