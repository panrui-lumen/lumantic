import { useEffect, useState } from "react";
import { AlertIcon } from "./Icons";

type SiteBannerPayload = {
	enabled: boolean;
	message: string;
};

const BANNER_CHANGED_EVENT = "lumantic-site-banner-changed";

export function SiteBanner() {
	const [banner, setBanner] = useState<SiteBannerPayload | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		const onChanged = () => setReloadToken((n) => n + 1);
		window.addEventListener(BANNER_CHANGED_EVENT, onChanged);
		return () => window.removeEventListener(BANNER_CHANGED_EVENT, onChanged);
	}, []);

	useEffect(() => {
		let cancelled = false;
		fetch("/api/site-banner")
			.then((res) => (res.ok ? res.json() : null))
			.then((data: SiteBannerPayload | null) => {
				if (!cancelled && data) setBanner(data);
			})
			.catch(() => {
				// Banner is non-critical; fail closed (hidden).
			});
		return () => {
			cancelled = true;
		};
	}, [reloadToken]);

	const message = banner?.message?.trim() ?? "";
	if (!banner?.enabled || !message) return null;

	return (
		<div
			role="status"
			className="sticky top-0 z-[70] border-b border-amber-400/25 bg-amber-500/15 px-4 py-2.5 text-center text-sm text-amber-50 backdrop-blur-md"
		>
			<p className="mx-auto flex max-w-5xl items-start justify-center gap-2 text-pretty">
				<AlertIcon className="mt-0.5 size-4 shrink-0 text-amber-200/90" />
				<span className="min-w-0 whitespace-pre-wrap">{message}</span>
			</p>
		</div>
	);
}
