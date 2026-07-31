import { useEffect, useState } from "react";
import logo from "../../assets/lumantic-logo.png";
import { AlertIcon, LockIcon, SpinnerIcon } from "../../components/Icons";
import { ChatArtifactView } from "./ChatArtifactView";
import { parseChatArtifact, parseChatWorking } from "../../../shared/beacon-analytics";
import { MessageBody, WorkingConnectorPills } from "./MessageBody";
import { PublicUserProfileHost } from "./UserProfileModal";
import { UserChip } from "./UserChip";
import type { ChatMessage } from "./types";

type SharedPayload = {
	code: string;
	title: string;
	isPublic: boolean;
	messages: ChatMessage[];
	createdBy: string | null;
	createdAt: string;
};

function readCode() {
	const match = window.location.pathname.match(/^\/s\/([a-z0-9]+)/i);
	return match?.[1] ?? "";
}

export function SharedChatPage() {
	const code = readCode();
	const [share, setShare] = useState<SharedPayload | null>(null);
	const [loading, setLoading] = useState(Boolean(code));
	const [error, setError] = useState(code ? "" : "Invalid share link");
	const [needsAuth, setNeedsAuth] = useState(false);

	useEffect(() => {
		if (!code) return;

		let cancelled = false;
		const token = localStorage.getItem("lumantic_app_token");
		fetch(`/api/app/chat-shares/${encodeURIComponent(code)}`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		})
			.then(async (res) => {
				const data = (await res.json().catch(() => ({}))) as { share?: SharedPayload; error?: string };
				if (cancelled) return;
				if (res.status === 401) {
					setNeedsAuth(true);
					setError(data.error || "This share link is private. Sign in to view it.");
					return;
				}
				if (!res.ok || !data.share) {
					setError(data.error || "Share not found");
					return;
				}
				setShare(data.share);
			})
			.catch(() => {
				if (!cancelled) setError("Failed to load shared chat");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [code]);

	return (
		<div className="min-h-screen bg-void text-violet-50">
			<PublicUserProfileHost />
			<header className="border-b border-violet-500/10 px-4 py-4 sm:px-6">
				<div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
					<a href="/app" className="flex items-center gap-2.5 transition hover:opacity-90">
						<img src={logo} alt="" className="h-7 w-7" />
						<span className="font-display text-sm font-semibold tracking-tight">Lumantic</span>
					</a>
					<a
						href={needsAuth ? "/app" : "/app"}
						className="rounded-lg border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-white/[0.04]"
					>
						{needsAuth ? "Sign in" : "Open app"}
					</a>
				</div>
			</header>

			<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
				{loading ? (
					<div className="flex justify-center py-24">
						<SpinnerIcon className="size-6 text-violet-400" />
					</div>
				) : error ? (
					<div className="rounded-2xl border border-violet-500/15 bg-ink p-6 text-center">
						<span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-200">
							{needsAuth ? <LockIcon className="size-4" /> : <AlertIcon className="size-4" />}
						</span>
						<p className="font-display text-base font-semibold text-violet-50">
							{needsAuth ? "Private share" : "Can't open share"}
						</p>
						<p className="mt-2 text-sm text-violet-300/60">{error}</p>
						{needsAuth && (
							<a
								href="/app"
								className="mt-5 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
							>
								Sign in to view
							</a>
						)}
					</div>
				) : share ? (
					<div className="space-y-6">
						<div>
							<p className="text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase">
								{share.isPublic ? "Public chat" : "Workspace share"}
							</p>
							<h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-violet-50">{share.title}</h1>
							{share.createdBy && (
								<div className="mt-2 flex items-center gap-1.5 text-xs text-violet-400/50">
									<span>Shared by</span>
									<UserChip name={share.createdBy} size="xs" muted />
								</div>
							)}
						</div>

						<div className="space-y-4">
							{share.messages.map((m, i) => {
								const isUser = m.role === "user";
								const artifact = !isUser ? parseChatArtifact(m.artifact) : null;
								const working = !isUser ? parseChatWorking(m.working) : null;
								return (
									<div key={m.id ?? i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
										<div
											className={`flex max-w-[min(100%,36rem)] flex-col gap-2 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
												isUser ? "bg-violet-500/25 text-violet-50" : "bg-white/[0.03] text-violet-100"
											}`}
										>
											{isUser ? (
												<p className="whitespace-pre-wrap">{m.content}</p>
											) : (
												<MessageBody content={m.content} />
											)}
											{artifact && (
												<div className="mt-1">
													<ChatArtifactView artifact={artifact} />
												</div>
											)}
											{working?.connectors && working.connectors.length > 0 && (
												<WorkingConnectorPills working={m.working} />
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				) : null}
			</main>
		</div>
	);
}
