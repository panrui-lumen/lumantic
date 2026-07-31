import type { Plugin } from "vite";

const PROD_ICON = "/lumantic-logo.png";
const DEV_ICON = "/lumantic-logo-dev.png";

/**
 * In `vite` serve (dev), swap the tab / apple-touch icons to the yellow
 * logo so local sessions are easy to tell apart from production.
 */
export function devFaviconPlugin(): Plugin {
	return {
		name: "lumantic-dev-favicon",
		transformIndexHtml(html, ctx) {
			if (!ctx.server) return html;
			return html
				.replace(
					`<link rel="icon" type="image/png" href="${PROD_ICON}" />`,
					`<link rel="icon" type="image/png" href="${DEV_ICON}" />`,
				)
				.replace(
					`<link rel="apple-touch-icon" href="${PROD_ICON}" />`,
					`<link rel="apple-touch-icon" href="${DEV_ICON}" />`,
				);
		},
	};
}
