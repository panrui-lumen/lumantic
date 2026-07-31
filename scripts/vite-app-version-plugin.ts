import type { Plugin } from "vite";

/** Resolve a stable-enough build id for deploy detection (SHA in CI, else timestamp). */
export function resolveAppBuildId(env: NodeJS.ProcessEnv = process.env): string {
	const fromCi =
		env.GITHUB_SHA?.trim() || env.CF_PAGES_COMMIT_SHA?.trim() || env.COMMIT_SHA?.trim();
	if (fromCi) return fromCi.slice(0, 12);
	return `dev-${Date.now()}`;
}

/**
 * Injects `import.meta.env.VITE_APP_BUILD_ID` and serves/emits `/version.json`
 * so open tabs can detect a new deploy and prompt for reload.
 */
export function appVersionPlugin(buildId = resolveAppBuildId()): Plugin {
	const payload = JSON.stringify({ buildId });

	return {
		name: "lumantic-app-version",
		config() {
			return {
				define: {
					"import.meta.env.VITE_APP_BUILD_ID": JSON.stringify(buildId),
				},
			};
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const path = req.url?.split("?")[0];
				if (path !== "/version.json") {
					next();
					return;
				}
				res.setHeader("Content-Type", "application/json; charset=utf-8");
				res.setHeader("Cache-Control", "no-store");
				res.end(payload);
			});
		},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "version.json",
				source: payload,
			});
		},
	};
}
