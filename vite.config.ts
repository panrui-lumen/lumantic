import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { appVersionPlugin } from "./scripts/vite-app-version-plugin.ts";

export default defineConfig({
	plugins: [
		tailwindcss(),
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		cloudflare(),
		appVersionPlugin(),
	],
});
