import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckIcon, GlobeIcon, LinkIcon, LockIcon, ShareIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { Modal, Toggle } from "./ui";
import type { ChatMessage } from "./types";

export type ShareTarget = { kind: "api"; conversationId: number; title: string; messages: ChatMessage[] };

type ShareRecord = {
	code: string;
	title: string;
	isPublic: boolean;
	shortPath: string;
};

function shareUrl(shortPath: string) {
	return `${window.location.origin}${shortPath}`;
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function ShareChatModal({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
	const { request } = useAppAuth();
	const targetKey = `api:${target.conversationId}`;
	const [activeTargetKey, setActiveTargetKey] = useState(targetKey);
	const [isPublic, setIsPublic] = useState(false);
	const [share, setShare] = useState<ShareRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [sharing, setSharing] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");

	if (targetKey !== activeTargetKey) {
		setActiveTargetKey(targetKey);
		setIsPublic(false);
		setShare(null);
		setLoading(true);
		setSaving(false);
		setSharing(false);
		setCopied(false);
		setError("");
	}

	const url = share ? shareUrl(share.shortPath) : "";

	useEffect(() => {
		let cancelled = false;
		request<{ share: ShareRecord }>("/chat-shares", {
			method: "POST",
			body: JSON.stringify({
				conversationId: target.conversationId,
				title: target.title,
				isPublic: false,
				messages: target.messages,
			}),
		})
			.then((data) => {
				if (cancelled) return;
				setShare(data.share);
				setIsPublic(data.share.isPublic);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to create share link");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [request, target]);

	async function handlePublicChange(next: boolean) {
		if (!share) return;
		setIsPublic(next);
		setSaving(true);
		setError("");
		try {
			const data = await request<{ share: ShareRecord }>(`/chat-shares/${share.code}`, {
				method: "PATCH",
				body: JSON.stringify({ isPublic: next, messages: target.messages, title: target.title }),
			});
			setShare(data.share);
			setIsPublic(data.share.isPublic);
		} catch (err) {
			setIsPublic(!next);
			setError(err instanceof Error ? err.message : "Failed to update share");
		} finally {
			setSaving(false);
		}
	}

	async function handleCopy() {
		if (!url) return;
		const ok = await copyText(url);
		if (ok) {
			setCopied(true);
			toast.success("Link copied");
			setTimeout(() => setCopied(false), 1600);
		} else {
			toast.error("Couldn't copy link");
		}
	}

	async function handleNativeShare() {
		if (!url || !share) return;
		setSharing(true);
		try {
			if (typeof navigator.share === "function") {
				await navigator.share({
					title: share.title || "Lumantic chat",
					text: isPublic ? "Public Lumantic chat" : "Lumantic chat (sign-in required)",
					url,
				});
			} else {
				await handleCopy();
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			const ok = await copyText(url);
			if (ok) toast.success("Link copied");
			else toast.error("Couldn't share link");
		} finally {
			setSharing(false);
		}
	}

	return (
		<Modal title="Share chat" onClose={onClose}>
			<div className="space-y-4">
				{loading ? (
					<div className="flex justify-center py-8">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : error && !share ? (
					<p className="text-sm text-rose-300">{error}</p>
				) : (
					<>
						<div className="flex items-start justify-between gap-3 rounded-xl border border-violet-500/15 bg-white/[0.03] px-3.5 py-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									{isPublic ? (
										<GlobeIcon className="size-4 shrink-0 text-violet-300" />
									) : (
										<LockIcon className="size-4 shrink-0 text-violet-400/60" />
									)}
									<p className="text-sm font-medium text-violet-50">Public</p>
								</div>
								<p className="mt-1 text-xs leading-relaxed text-violet-400/55">
									{isPublic
										? "Anyone with the link can view this chat, even without signing in."
										: "Only people signed in to your workspace can open this link."}
								</p>
							</div>
							<Toggle checked={isPublic} onChange={handlePublicChange} disabled={saving || !share} />
						</div>

						<div className="space-y-2">
							<label className="text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase">Short link</label>
							<div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-white/[0.02] px-3 py-2.5">
								<LinkIcon className="size-4 shrink-0 text-violet-400/50" />
								<input
									readOnly
									value={url}
									onFocus={(e) => e.currentTarget.select()}
									className="min-w-0 flex-1 truncate bg-transparent text-sm text-violet-100 outline-none"
								/>
								<button
									type="button"
									onClick={handleCopy}
									className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-violet-200 transition hover:bg-white/[0.05]"
								>
									{copied ? (
										<span className="inline-flex items-center gap-1 text-emerald-300">
											<CheckIcon className="size-3.5" />
											Copied
										</span>
									) : (
										"Copy"
									)}
								</button>
							</div>
						</div>

						{error && <p className="text-sm text-rose-300">{error}</p>}

						<div className="flex items-center justify-end gap-2 pt-1">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:text-violet-100"
							>
								Done
							</button>
							<button
								type="button"
								onClick={handleNativeShare}
								disabled={!share || sharing}
								className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{sharing ? <SpinnerIcon className="size-3.5" /> : <ShareIcon className="size-3.5" />}
								{typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Share" : "Copy link"}
							</button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}
