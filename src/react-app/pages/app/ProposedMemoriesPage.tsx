import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronDown, InboxIcon, PencilIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import {
	CategoryPill,
	ConfirmDeleteButton,
	EmptyState,
	ErrorBanner,
	ListPagination,
	selectClass,
	textareaClass,
} from "./ui";
import { MEMORY_CATEGORIES, type ProposedMemory } from "./types";
import { formatWithPrefs, useResolvedDateTimePrefs } from "./companySettings";

const PAGE_SIZE = 5;

function ProposedCard({
	item,
	onApprove,
	onDeny,
}: {
	item: ProposedMemory;
	onApprove: (id: number, overrides?: { content: string; category: string }) => Promise<void>;
	onDeny: (id: number) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [content, setContent] = useState(item.content);
	const [category, setCategory] = useState(item.category);
	const [busy, setBusy] = useState(false);
	const dateTimePrefs = useResolvedDateTimePrefs();
	const proposedLabel = formatWithPrefs(item.created_at, dateTimePrefs, {
		dateStyle: "medium",
		timeStyle: "short",
	});

	if (editing) {
		return (
			<div className="rounded-2xl border border-violet-400/40 bg-white/[0.04] p-4">
				<textarea value={content} onChange={(e) => setContent(e.target.value)} autoFocus className={textareaClass} />
				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="relative">
						<select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
							{MEMORY_CATEGORIES.map((cat) => (
								<option key={cat} value={cat} className="bg-ink">
									{cat}
								</option>
							))}
						</select>
						<ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-violet-400/50" />
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								setEditing(false);
								setContent(item.content);
								setCategory(item.category);
							}}
							className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100"
						>
							Cancel
						</button>
						<button
							onClick={async () => {
								if (!content.trim()) return;
								setBusy(true);
								try {
									await onApprove(item.id, { content: content.trim(), category });
								} finally {
									setBusy(false);
								}
							}}
							disabled={busy || !content.trim()}
							className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{busy && <SpinnerIcon className="size-3.5" />}
							Save &amp; approve
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
			<p className="text-sm leading-relaxed text-violet-100">{item.content}</p>
			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-violet-400/50">
				<CategoryPill category={item.category} />
				<span className="inline-flex items-center rounded-full border border-violet-500/20 px-2.5 py-0.5 font-medium text-violet-300/70">
					{Math.round(item.confidence * 100)}% confidence
				</span>
				<span>·</span>
				<span>Proposed {proposedLabel || item.created_at}</span>
			</div>
			<div className="mt-4 flex items-center gap-2">
				<button
					onClick={async () => {
						setBusy(true);
						try {
							await onApprove(item.id);
						} finally {
							setBusy(false);
						}
					}}
					disabled={busy}
					className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{busy ? <SpinnerIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
					Approve
				</button>
				<button
					onClick={() => setEditing(true)}
					className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 px-3 py-1.5 text-sm font-medium text-violet-200 transition hover:border-violet-400/40 hover:text-violet-50"
				>
					<PencilIcon className="size-3.5" />
					Edit
				</button>
				<div className="ml-auto">
					<ConfirmDeleteButton onConfirm={() => onDeny(item.id)} label="Deny" />
				</div>
			</div>
		</div>
	);
}

export function ProposedMemoriesList() {
	const { request } = useAppAuth();
	const queryClient = useQueryClient();
	const [items, setItems] = useState<ProposedMemory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);

	useEffect(() => {
		request<{ proposedMemories: ProposedMemory[] }>("/proposed-memories")
			.then((data) => {
				setItems(data.proposedMemories);
				setPage(1);
			})
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load proposed memories"))
			.finally(() => setLoading(false));
	}, [request]);

	const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	if (page !== safePage) {
		setPage(safePage);
	}

	function refreshBadge() {
		void queryClient.invalidateQueries({ queryKey: ["proposed-memories"] });
	}

	async function handleApprove(id: number, overrides?: { content: string; category: string }) {
		await request(`/proposed-memories/${id}/approve`, { method: "POST", body: JSON.stringify(overrides ?? {}) });
		setItems((prev) => prev.filter((p) => p.id !== id));
		refreshBadge();
	}

	async function handleDeny(id: number) {
		setItems((prev) => prev.filter((p) => p.id !== id));
		refreshBadge();
		try {
			await request(`/proposed-memories/${id}`, { method: "DELETE" });
		} catch {
			// local removal already applied
		}
	}

	if (error) return <ErrorBanner message={error} />;

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<SpinnerIcon className="size-5 text-violet-400" />
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<EmptyState
				icon={<InboxIcon className="size-5" />}
				title="Nothing to review"
				description="When Lumantic notices something new worth remembering, it'll show up here for your approval."
			/>
		);
	}

	return (
		<div className="space-y-3">
			{pageItems.map((item) => (
				<ProposedCard key={item.id} item={item} onApprove={handleApprove} onDeny={handleDeny} />
			))}
			<ListPagination
				page={safePage}
				pageSize={PAGE_SIZE}
				total={items.length}
				onPageChange={setPage}
				className="pt-2"
			/>
		</div>
	);
}

export function ProposedMemoriesPage() {
	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-violet-500/10 px-6 py-5">
				<h1 className="font-display text-xl font-semibold text-violet-50">Proposed memories</h1>
				<p className="mt-1 text-sm text-violet-300/60">
					New things Lumantic picked up from chats and data. Approve to save them, edit first, or deny to discard.
				</p>
			</div>
			<div className="flex-1 overflow-y-auto px-6 py-5">
				<ProposedMemoriesList />
			</div>
		</div>
	);
}
