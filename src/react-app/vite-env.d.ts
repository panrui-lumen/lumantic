/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Build id written to `/version.json` so open tabs can detect deploys. */
	readonly VITE_APP_BUILD_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
